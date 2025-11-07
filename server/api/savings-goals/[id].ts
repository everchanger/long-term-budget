import { eq, and, inArray } from "drizzle-orm";
import { updateSavingsGoalSchema } from "../../../database/validation-schemas";
import { enrichSavingsGoalsWithProgress } from "../../utils/savingsGoalCalculations";

export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const db = useDrizzle();
  const method = getMethod(event);
  const goalId = getRouterParam(event, "id");

  if (!goalId || isNaN(parseInt(goalId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid savings goal ID",
    });
  }

  // Verify that the savings goal belongs to the user's household
  const [goalExists] = await db
    .select({
      id: tables.savingsGoals.id,
      householdId: tables.savingsGoals.householdId,
    })
    .from(tables.savingsGoals)
    .innerJoin(
      tables.households,
      eq(tables.savingsGoals.householdId, tables.households.id)
    )
    .where(
      and(
        eq(tables.savingsGoals.id, parseInt(goalId)),
        eq(tables.households.userId, session.user.id)
      )
    );

  if (!goalExists) {
    throw createError({
      statusCode: 404,
      statusMessage: "Savings goal not found or access denied",
    });
  }

  if (method === "GET") {
    const [goal] = await db
      .select()
      .from(tables.savingsGoals)
      .where(eq(tables.savingsGoals.id, parseInt(goalId)));

    if (!goal) {
      throw createError({
        statusCode: 404,
        statusMessage: "Savings goal not found",
      });
    }

    // Get linked savings account IDs
    const linkedAccounts = await db
      .select({ accountId: tables.savingsGoalAccounts.savingsAccountId })
      .from(tables.savingsGoalAccounts)
      .where(eq(tables.savingsGoalAccounts.savingsGoalId, parseInt(goalId)));

    const savingsAccountIds = linkedAccounts.map((link) => link.accountId);

    // Enrich with progress data
    const enrichedGoals = await enrichSavingsGoalsWithProgress(
      [{ ...goal, savingsAccountIds }],
      goalExists.householdId,
      db
    );

    return enrichedGoals[0];
  }

  if (method === "PUT") {
    const body = await readBody(event);

    // Validate using our Zod schema
    let validatedData;
    try {
      validatedData = updateSavingsGoalSchema.parse(body);
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error,
      });
    }

    // Extract savingsAccountIds (not stored in the savings_goals table)
    const { savingsAccountIds, ...goalData } = validatedData;

    // If savings account IDs provided, verify they all belong to persons in this household
    if (savingsAccountIds && savingsAccountIds.length > 0) {
      const accounts = await db
        .select({
          id: tables.savingsAccounts.id,
          personId: tables.savingsAccounts.personId,
        })
        .from(tables.savingsAccounts)
        .innerJoin(
          tables.persons,
          eq(tables.savingsAccounts.personId, tables.persons.id)
        )
        .where(
          and(
            eq(tables.persons.householdId, goalExists.householdId),
            inArray(tables.savingsAccounts.id, savingsAccountIds)
          )
        );

      if (accounts.length !== savingsAccountIds.length) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "One or more savings accounts do not belong to this household",
        });
      }
    }

    const [result] = await db
      .update(tables.savingsGoals)
      .set({
        ...goalData,
        updatedAt: new Date(),
      })
      .where(eq(tables.savingsGoals.id, parseInt(goalId)))
      .returning();

    // Update linked savings accounts if provided
    if (savingsAccountIds !== undefined) {
      // Delete existing links
      await db
        .delete(tables.savingsGoalAccounts)
        .where(eq(tables.savingsGoalAccounts.savingsGoalId, parseInt(goalId)));

      // Add new links
      if (savingsAccountIds.length > 0) {
        await db.insert(tables.savingsGoalAccounts).values(
          savingsAccountIds.map((accountId) => ({
            savingsGoalId: parseInt(goalId),
            savingsAccountId: accountId,
          }))
        );
      }
    }

    return result;
  }

  if (method === "DELETE") {
    await db
      .delete(tables.savingsGoals)
      .where(eq(tables.savingsGoals.id, parseInt(goalId)));

    return { success: true };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

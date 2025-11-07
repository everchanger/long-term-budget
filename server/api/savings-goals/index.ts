import { eq, and, inArray } from "drizzle-orm";
import { insertSavingsGoalSchema } from "../../../database/validation-schemas";
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

  if (method === "GET") {
    const query = getQuery(event);
    const householdId = query.householdId as string;

    if (householdId) {
      // Verify that the household belongs to the authenticated user
      const [householdExists] = await db
        .select({ id: tables.households.id })
        .from(tables.households)
        .where(
          and(
            eq(tables.households.id, parseInt(householdId)),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!householdExists) {
        throw createError({
          statusCode: 403,
          statusMessage: "Access denied: Household does not belong to you",
        });
      }

      const goals = await db
        .select()
        .from(tables.savingsGoals)
        .where(eq(tables.savingsGoals.householdId, parseInt(householdId)))
        .orderBy(tables.savingsGoals.createdAt);

      // Fetch linked accounts for each goal
      const goalsWithAccounts = await Promise.all(
        goals.map(async (goal) => {
          const linkedAccounts = await db
            .select({
              savingsAccountId: tables.savingsGoalAccounts.savingsAccountId,
            })
            .from(tables.savingsGoalAccounts)
            .where(eq(tables.savingsGoalAccounts.savingsGoalId, goal.id));

          return {
            ...goal,
            savingsAccountIds: linkedAccounts.map((la) => la.savingsAccountId),
          };
        })
      );

      // Enrich goals with calculated progress data
      const enrichedGoals = await enrichSavingsGoalsWithProgress(
        goalsWithAccounts,
        parseInt(householdId),
        db
      );

      return enrichedGoals;
    } else {
      // Get all savings goals for all households of the user
      const result = await db
        .select()
        .from(tables.savingsGoals)
        .innerJoin(
          tables.households,
          eq(tables.savingsGoals.householdId, tables.households.id)
        )
        .where(eq(tables.households.userId, session.user.id))
        .orderBy(tables.savingsGoals.createdAt);

      // Extract goals and fetch linked accounts
      const goals = result.map((item) => item.savings_goals);
      const goalsWithAccounts = await Promise.all(
        goals.map(async (goal) => {
          const linkedAccounts = await db
            .select({
              savingsAccountId: tables.savingsGoalAccounts.savingsAccountId,
            })
            .from(tables.savingsGoalAccounts)
            .where(eq(tables.savingsGoalAccounts.savingsGoalId, goal.id));

          return {
            ...goal,
            savingsAccountIds: linkedAccounts.map((la) => la.savingsAccountId),
          };
        })
      );

      // Group by household and enrich each group
      const goalsByHousehold = goalsWithAccounts.reduce((acc, goal) => {
        const householdId = goal.householdId;
        if (!acc[householdId]) {
          acc[householdId] = [];
        }
        acc[householdId].push(goal);
        return acc;
      }, {} as Record<number, any[]>);

      const enrichedResults = [];
      for (const [householdId, goals] of Object.entries(goalsByHousehold)) {
        const enrichedGoals = await enrichSavingsGoalsWithProgress(
          goals,
          parseInt(householdId),
          db
        );
        enrichedResults.push(...enrichedGoals);
      }

      return enrichedResults;
    }
  }

  if (method === "POST") {
    const body = await readBody(event);

    // Validate using our Zod schema (includes savingsAccountIds)
    const validatedData = insertSavingsGoalSchema.parse(body);

    // Verify that the household belongs to the authenticated user
    const [householdExists] = await db
      .select({ id: tables.households.id })
      .from(tables.households)
      .where(
        and(
          eq(tables.households.id, validatedData.householdId),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!householdExists) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: Household does not belong to you",
      });
    }

    // If savings account IDs provided, verify they all belong to persons in this household
    if (
      validatedData.savingsAccountIds &&
      validatedData.savingsAccountIds.length > 0
    ) {
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
            eq(tables.persons.householdId, validatedData.householdId),
            inArray(tables.savingsAccounts.id, validatedData.savingsAccountIds)
          )
        );

      if (accounts.length !== validatedData.savingsAccountIds.length) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "One or more savings accounts do not belong to this household",
        });
      }
    }

    const [result] = await db
      .insert(tables.savingsGoals)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        priority: validatedData.priority || 1,
        category: validatedData.category,
        householdId: validatedData.householdId,
      })
      .returning();

    // Link savings accounts if provided
    if (
      validatedData.savingsAccountIds &&
      validatedData.savingsAccountIds.length > 0
    ) {
      await db.insert(tables.savingsGoalAccounts).values(
        validatedData.savingsAccountIds.map((accountId) => ({
          savingsGoalId: result.id,
          savingsAccountId: accountId,
        }))
      );
    }

    return result;
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

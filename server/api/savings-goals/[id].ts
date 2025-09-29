import { eq, and } from "drizzle-orm";
import { updateSavingsGoalSchema } from "../../../database/validation-schemas";

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
    const result = await db
      .select()
      .from(tables.savingsGoals)
      .where(eq(tables.savingsGoals.id, parseInt(goalId)));

    return result[0];
  }

  if (method === "PUT") {
    const body = await readBody(event);

    // Validate using our Zod schema
    const validatedData = updateSavingsGoalSchema.parse(body);

    const [result] = await db
      .update(tables.savingsGoals)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(tables.savingsGoals.id, parseInt(goalId)))
      .returning();

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

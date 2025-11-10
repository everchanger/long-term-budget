import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  // Get session from middleware
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
    // Get budget for user's household (or create if doesn't exist)
    const userId = session.user.id;

    // Get user's household
    const [household] = await db
      .select()
      .from(tables.households)
      .where(eq(tables.households.userId, userId))
      .limit(1);

    if (!household) {
      throw createError({
        statusCode: 404,
        statusMessage: "Household not found",
      });
    }

    // Check if budget exists for this household
    let [budget] = await db
      .select()
      .from(tables.budgets)
      .where(eq(tables.budgets.householdId, household.id))
      .limit(1);

    // Create budget if it doesn't exist
    if (!budget) {
      const [newBudget] = await db
        .insert(tables.budgets)
        .values({
          householdId: household.id,
          name: "Household Budget",
        })
        .returning();

      budget = newBudget;
    }

    return successResponse(budget);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

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
    // Get all budget expenses for user's household budget
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

    // Get household budget
    const [budget] = await db
      .select()
      .from(tables.budgets)
      .where(eq(tables.budgets.householdId, household.id))
      .limit(1);

    if (!budget) {
      // No budget yet, return empty array
      return successResponse([]);
    }

    // Get all budget expenses
    const budgetExpenses = await db
      .select()
      .from(tables.budgetExpenses)
      .where(eq(tables.budgetExpenses.budgetId, budget.id))
      .orderBy(desc(tables.budgetExpenses.createdAt));

    return successResponse(budgetExpenses);
  }

  if (method === "POST") {
    // Create a new budget expense
    const body = await readBody(event);
    const { name, amount, category = "other" } = body;

    if (!name || !amount) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name and amount are required",
      });
    }

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

    // Get or create household budget
    let [budget] = await db
      .select()
      .from(tables.budgets)
      .where(eq(tables.budgets.householdId, household.id))
      .limit(1);

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

    // Create budget expense
    const [newBudgetExpense] = await db
      .insert(tables.budgetExpenses)
      .values({
        budgetId: budget.id,
        name,
        amount,
        category,
      })
      .returning();

    return successResponse(newBudgetExpense);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

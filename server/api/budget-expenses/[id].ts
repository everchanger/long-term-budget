import { parseIdParam } from "../../utils/api-helpers";
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const budgetExpenseId = parseIdParam(
    event,
    "id",
    "Budget expense ID is required"
  );
  const db = useDrizzle();

  // Get the budget expense to check if it exists
  const [existingBudgetExpense] = await db
    .select()
    .from(tables.budgetExpenses)
    .where(eq(tables.budgetExpenses.id, budgetExpenseId))
    .limit(1);

  if (!existingBudgetExpense) {
    throw createError({
      statusCode: 404,
      statusMessage: "Budget expense not found",
    });
  }

  // Verify that the budget expense belongs to the user's household budget
  const [budget] = await db
    .select({
      budget: tables.budgets,
      household: tables.households,
    })
    .from(tables.budgets)
    .innerJoin(
      tables.households,
      eq(tables.budgets.householdId, tables.households.id)
    )
    .where(eq(tables.budgets.id, existingBudgetExpense.budgetId))
    .limit(1);

  if (!budget || budget.household.userId !== session.user.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Budget expense not found",
    });
  }

  const method = getMethod(event);

  if (method === "GET") {
    // Return the budget expense
    return successResponse(existingBudgetExpense);
  }

  if (method === "PUT") {
    // Update budget expense
    const body = await readBody(event);
    const { name, amount, category = "other" } = body;

    if (!name || !amount) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name and amount are required",
      });
    }

    const [updatedBudgetExpense] = await db
      .update(tables.budgetExpenses)
      .set({
        name,
        amount: amount.toString(),
        category,
      })
      .where(eq(tables.budgetExpenses.id, budgetExpenseId))
      .returning();

    if (!updatedBudgetExpense) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget expense not found",
      });
    }

    return successResponse(updatedBudgetExpense);
  }

  if (method === "DELETE") {
    // Delete budget expense
    const [deletedBudgetExpense] = await db
      .delete(tables.budgetExpenses)
      .where(eq(tables.budgetExpenses.id, budgetExpenseId))
      .returning();

    if (!deletedBudgetExpense) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget expense not found",
      });
    }

    return deleteResponse();
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

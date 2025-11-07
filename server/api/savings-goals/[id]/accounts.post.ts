import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const goalId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!goalId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Goal ID is required",
    });
  }

  if (!body.savingsAccountId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Savings account ID is required",
    });
  }

  // Verify the goal exists
  const [goal] = await db
    .select()
    .from(tables.savingsGoals)
    .where(eq(tables.savingsGoals.id, parseInt(goalId)))
    .limit(1);

  if (!goal) {
    throw createError({
      statusCode: 404,
      statusMessage: "Savings goal not found",
    });
  }

  // Verify the savings account exists
  const [account] = await db
    .select()
    .from(tables.savingsAccounts)
    .where(eq(tables.savingsAccounts.id, parseInt(body.savingsAccountId)))
    .limit(1);

  if (!account) {
    throw createError({
      statusCode: 404,
      statusMessage: "Savings account not found",
    });
  }

  // Check if already linked
  const [existing] = await db
    .select()
    .from(tables.savingsGoalAccounts)
    .where(
      and(
        eq(tables.savingsGoalAccounts.savingsGoalId, parseInt(goalId)),
        eq(
          tables.savingsGoalAccounts.savingsAccountId,
          parseInt(body.savingsAccountId)
        )
      )
    )
    .limit(1);

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Account is already linked to this goal",
    });
  }

  // Create the link
  await db.insert(tables.savingsGoalAccounts).values({
    savingsGoalId: parseInt(goalId),
    savingsAccountId: parseInt(body.savingsAccountId),
  });

  return {
    success: true,
    message: "Savings account linked to goal",
  };
});

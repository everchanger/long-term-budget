import { eq, and } from "drizzle-orm";
import { parseIdParam } from "../../../utils/api-helpers";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const goalId = parseIdParam(event, "id", "Goal ID is required");
  const body = await readBody(event);

  if (!body.savingsAccountId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Savings account ID is required",
    });
  }

  const savingsAccountId = parseInt(body.savingsAccountId, 10);
  if (isNaN(savingsAccountId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid savings account ID",
    });
  }

  // Verify the goal exists
  const [goal] = await db
    .select()
    .from(tables.savingsGoals)
    .where(eq(tables.savingsGoals.id, goalId))
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
    .where(eq(tables.savingsAccounts.id, savingsAccountId))
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
        eq(tables.savingsGoalAccounts.savingsGoalId, goalId),
        eq(tables.savingsGoalAccounts.savingsAccountId, savingsAccountId)
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
    savingsGoalId: goalId,
    savingsAccountId: savingsAccountId,
  });

  return {
    success: true,
    message: "Savings account linked to goal",
  };
});

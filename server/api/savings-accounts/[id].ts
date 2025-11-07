import { parseIdParam } from "../../utils/api-helpers";

export default defineEventHandler(async (event) => {
  // Get session from middleware
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const accountIdInt = parseIdParam(event, "id", "Account ID is required");

  const db = useDrizzle();

  // First get the savings account to check if it exists
  const [existingAccount] = await db
    .select()
    .from(tables.savingsAccounts)
    .where(eq(tables.savingsAccounts.id, accountIdInt))
    .limit(1);

  if (!existingAccount) {
    throw createError({
      statusCode: 404,
      statusMessage: "Savings account not found",
    });
  }

  // Then verify that the account's person belongs to the authenticated user's household
  const [personExists] = await db
    .select({ id: tables.persons.id })
    .from(tables.persons)
    .innerJoin(
      tables.households,
      eq(tables.persons.householdId, tables.households.id)
    )
    .where(
      and(
        eq(tables.persons.id, existingAccount.personId),
        eq(tables.households.userId, session.user.id)
      )
    );

  if (!personExists) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Access denied: Savings account does not belong to your household",
    });
  }

  const method = getMethod(event);

  if (method === "GET") {
    // Return the savings account
    return existingAccount;
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const { name, currentBalance, interestRate, accountType, monthlyDeposit } =
      body;

    if (!name || !currentBalance) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    const [updatedAccount] = await db
      .update(tables.savingsAccounts)
      .set({
        name,
        currentBalance,
        interestRate: interestRate || null,
        accountType,
        monthlyDeposit:
          monthlyDeposit !== undefined ? monthlyDeposit || null : undefined,
      })
      .where(eq(tables.savingsAccounts.id, accountIdInt))
      .returning();

    if (!updatedAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Savings account not found",
      });
    }

    return updatedAccount;
  }

  if (method === "DELETE") {
    const [deletedAccount] = await db
      .delete(tables.savingsAccounts)
      .where(eq(tables.savingsAccounts.id, accountIdInt))
      .returning();

    if (!deletedAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Savings account not found",
      });
    }

    return { message: "Savings account deleted successfully" };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

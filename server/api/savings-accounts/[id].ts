import { successResponse, deleteResponse } from "../../utils/api-response";
import { parseIdParam } from "../../utils/api-helpers";
import { verifyPersonAccessOrThrow } from "../../utils/authorization";
import {
  percentageToDecimal,
  convertInterestRateForDisplay,
} from "../../utils/interest-rate";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const accountIdInt = parseIdParam(event, "id", "Account ID is required");
  const db = useDrizzle();

  // Get the savings account to check if it exists
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

  // Verify that the account's person belongs to the authenticated user's household
  await verifyPersonAccessOrThrow(session, existingAccount.personId, db);

  const method = getMethod(event);

  if (method === "GET") {
    // Convert decimal interest rate to percentage for display
    const converted = convertInterestRateForDisplay(existingAccount);
    return successResponse(converted);
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
        interestRate: interestRate ? percentageToDecimal(interestRate) : null, // Convert percentage to decimal
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

    // Convert decimal interest rate back to percentage for response
    const converted = convertInterestRateForDisplay(updatedAccount);

    return successResponse(converted);
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

    return deleteResponse("Savings account deleted successfully");
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

import { auth } from "~~/lib/auth";
import { verifyPersonAccess } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const accountId = getRouterParam(event, "id");
    if (!accountId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Account ID is required",
      });
    }

    // First get the savings account to check which person it belongs to
    const existingAccount = await db
      .select()
      .from(tables.savingsAccounts)
      .where(eq(tables.savingsAccounts.id, parseInt(accountId)))
      .limit(1);

    if (existingAccount.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Savings account not found",
      });
    }

    // Verify that the account's person belongs to the authenticated user's household
    const authorizedPerson = await verifyPersonAccess(
      existingAccount[0].personId,
      session.user.id
    );

    if (!authorizedPerson) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Access denied: Savings account does not belong to your household",
      });
    }

    const method = getMethod(event);

    if (method === "PUT") {
      const body = await readBody(event);
      const { name, currentBalance, interestRate, accountType } = body;

      if (!name || !currentBalance) {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing required fields",
        });
      }

      const result = await db
        .update(tables.savingsAccounts)
        .set({
          name,
          currentBalance: currentBalance.toString(),
          interestRate: interestRate ? interestRate.toString() : null,
          accountType,
        })
        .where(eq(tables.savingsAccounts.id, parseInt(accountId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Savings account not found",
        });
      }

      return result[0];
    }

    if (method === "DELETE") {
      const result = await db
        .delete(tables.savingsAccounts)
        .where(eq(tables.savingsAccounts.id, parseInt(accountId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Savings account not found",
        });
      }

      return { success: true };
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    // Re-throw HTTP errors as-is
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Wrap other errors
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});

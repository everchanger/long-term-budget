import { auth } from "@s/utils/auth";
import { verifyPersonAccess } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
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

    const db = useDrizzle();

    // First get the broker account to check which person it belongs to
    const existingAccount = await db
      .select()
      .from(tables.brokerAccounts)
      .where(eq(tables.brokerAccounts.id, parseInt(accountId)))
      .limit(1);

    if (existingAccount.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Broker account not found",
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
          "Access denied: Broker account does not belong to your household",
      });
    }

    const method = getMethod(event);

    if (method === "PUT") {
      const body = await readBody(event);
      const { name, brokerName, accountType, currentValue } = body;

      if (!name || !currentValue) {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing required fields",
        });
      }

      const result = await db
        .update(tables.brokerAccounts)
        .set({
          name,
          brokerName,
          accountType,
          currentValue: currentValue.toString(),
        })
        .where(eq(tables.brokerAccounts.id, parseInt(accountId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Broker account not found",
        });
      }

      return result[0];
    }

    if (method === "DELETE") {
      const result = await db
        .delete(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, parseInt(accountId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Broker account not found",
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

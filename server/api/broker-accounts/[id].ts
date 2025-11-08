import { successResponse, deleteResponse } from "../../utils/api-response";
import { parseIdParam } from "../../utils/api-helpers";
import { verifyPersonAccessOrThrow } from "../../utils/authorization";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const accountIdNum = parseIdParam(event, "id", "Account ID is required");
  const method = getMethod(event);
  const db = useDrizzle();

  // Check authentication FIRST before any database queries
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "You must be logged in to access broker accounts",
    });
  }

  try {
    if (method === "GET") {
      // Get broker account
      const [brokerAccount] = await db
        .select({
          id: tables.brokerAccounts.id,
          name: tables.brokerAccounts.name,
          brokerName: tables.brokerAccounts.brokerName,
          accountType: tables.brokerAccounts.accountType,
          currentValue: tables.brokerAccounts.currentValue,
          personId: tables.brokerAccounts.personId,
          createdAt: tables.brokerAccounts.createdAt,
        })
        .from(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, accountIdNum))
        .limit(1);

      if (!brokerAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      // Verify access to the person who owns this account
      try {
        await verifyPersonAccessOrThrow(session, brokerAccount.personId, db);
      } catch (error) {
        // Convert 403 to 404 to avoid leaking resource existence
        if (error && typeof error === "object" && "statusCode" in error) {
          if (error.statusCode === 403) {
            throw createError({
              statusCode: 404,
              statusMessage: "Not Found",
              message: "Broker account not found or access denied",
            });
          }
        }
        throw error;
      }

      return successResponse(brokerAccount);
    }

    if (method === "PUT") {
      const body = await readBody(event);
      const { name, brokerName, accountType, currentValue } = body;

      if (!name || !currentValue) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          message:
            "Missing required fields: name and currentValue are required",
        });
      }

      // Check if the broker account exists
      const [existingAccount] = await db
        .select({
          id: tables.brokerAccounts.id,
          personId: tables.brokerAccounts.personId,
        })
        .from(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, accountIdNum))
        .limit(1);

      if (!existingAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      // Verify access to the person who owns this account
      try {
        await verifyPersonAccessOrThrow(session, existingAccount.personId, db);
      } catch (error) {
        // Convert 403 to 404 to avoid leaking resource existence
        if (error && typeof error === "object" && "statusCode" in error) {
          if (error.statusCode === 403) {
            throw createError({
              statusCode: 404,
              statusMessage: "Not Found",
              message: "Broker account not found or access denied",
            });
          }
        }
        throw error;
      }

      // Update the broker account
      const result = await db
        .update(tables.brokerAccounts)
        .set({
          name,
          brokerName: brokerName || null,
          accountType: accountType || null,
          currentValue,
        })
        .where(eq(tables.brokerAccounts.id, accountIdNum))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found",
        });
      }

      return successResponse(result[0]);
    }

    if (method === "DELETE") {
      // Check if the broker account exists
      const [existingAccount] = await db
        .select({
          id: tables.brokerAccounts.id,
          personId: tables.brokerAccounts.personId,
        })
        .from(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, accountIdNum))
        .limit(1);

      if (!existingAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      // Verify access to the person who owns this account
      try {
        await verifyPersonAccessOrThrow(session, existingAccount.personId, db);
      } catch (error) {
        // Convert 403 to 404 to avoid leaking resource existence
        if (error && typeof error === "object" && "statusCode" in error) {
          if (error.statusCode === 403) {
            throw createError({
              statusCode: 404,
              statusMessage: "Not Found",
              message: "Broker account not found or access denied",
            });
          }
        }
        throw error;
      }

      // Delete the broker account
      await db
        .delete(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, accountIdNum));

      return deleteResponse("Broker account deleted successfully");
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

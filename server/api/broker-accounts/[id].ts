import { parseIdParam } from "../../utils/api-helpers";

export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "You must be logged in to access broker accounts",
    });
  }

  const accountIdNum = parseIdParam(event, "id", "Account ID is required");

  const method = getMethod(event);
  const db = useDrizzle();

  try {
    if (method === "GET") {
      // Get broker account with authorization check via household ownership
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
        .innerJoin(
          tables.persons,
          eq(tables.brokerAccounts.personId, tables.persons.id)
        )
        .innerJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(
          and(
            eq(tables.brokerAccounts.id, accountIdNum),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!brokerAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      return brokerAccount;
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

      // First check if the broker account exists and belongs to user's household
      const [existingAccount] = await db
        .select({ id: tables.brokerAccounts.id })
        .from(tables.brokerAccounts)
        .innerJoin(
          tables.persons,
          eq(tables.brokerAccounts.personId, tables.persons.id)
        )
        .innerJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(
          and(
            eq(tables.brokerAccounts.id, accountIdNum),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!existingAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      // Update the broker account (set omitted fields to null for partial updates)
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
          message: "Broker account not found or access denied",
        });
      }

      return result[0];
    }

    if (method === "DELETE") {
      // First check if the broker account exists and belongs to user's household
      const [existingAccount] = await db
        .select({ id: tables.brokerAccounts.id })
        .from(tables.brokerAccounts)
        .innerJoin(
          tables.persons,
          eq(tables.brokerAccounts.personId, tables.persons.id)
        )
        .innerJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(
          and(
            eq(tables.brokerAccounts.id, accountIdNum),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!existingAccount) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Broker account not found or access denied",
        });
      }

      // Delete the broker account
      await db
        .delete(tables.brokerAccounts)
        .where(eq(tables.brokerAccounts.id, accountIdNum));

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

export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "You must be logged in to access broker accounts",
    });
  }

  const method = getMethod(event);
  const db = useDrizzle();

  try {
    if (method === "GET") {
      const query = getQuery(event);
      const personId = query.personId as string;

      if (personId) {
        // Get broker accounts for specific person with authorization
        const result = await db
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
              eq(tables.brokerAccounts.personId, parseInt(personId)),
              eq(tables.households.userId, session.user.id)
            )
          );

        return result;
      } else {
        // Get all broker accounts for all persons in the user's household
        const result = await db
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
          .where(eq(tables.households.userId, session.user.id));

        return result;
      }
    }

    if (method === "POST") {
      const body = await readBody(event);
      const { name, brokerName, accountType, currentValue, personId } = body;

      if (!name || !currentValue || !personId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          message:
            "Missing required fields: name, currentValue, and personId are required",
        });
      }

      // Verify that the person belongs to the authenticated user's household
      const [authorizedPerson] = await db
        .select({ id: tables.persons.id })
        .from(tables.persons)
        .innerJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(
          and(
            eq(tables.persons.id, parseInt(personId)),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!authorizedPerson) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "Access denied: Person does not belong to your household",
        });
      }

      const result = await db
        .insert(tables.brokerAccounts)
        .values({
          name,
          brokerName,
          accountType,
          currentValue: currentValue.toString(),
          personId: parseInt(personId),
        })
        .returning();

      return result[0];
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

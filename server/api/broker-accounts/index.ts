import { auth } from "@s/utils/auth";
import { verifyPersonAccess, getUserPersons } from "@s/utils/authorization";

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

    const method = getMethod(event);

    if (method === "GET") {
      const query = getQuery(event);
      const personId = query.personId as string;

      if (personId) {
        // Get broker accounts for specific person with authorization
        const authorizedPerson = await verifyPersonAccess(
          parseInt(personId),
          session.user.id
        );

        if (!authorizedPerson) {
          throw createError({
            statusCode: 403,
            statusMessage:
              "Access denied: Person does not belong to your household",
          });
        }

        const db = useDrizzle();

        const result = await db
          .select()
          .from(tables.brokerAccounts)
          .where(eq(tables.brokerAccounts.personId, parseInt(personId)));

        return result;
      } else {
        // Get all broker accounts for all persons in the user's household
        const userPersons = await getUserPersons(session.user.id);

        if (userPersons.length === 0) {
          return [];
        }

        const db = useDrizzle();
        const personIds = userPersons.map((p) => p.id);
        const result = await db
          .select()
          .from(tables.brokerAccounts)
          .where(
            personIds.length === 1
              ? eq(tables.brokerAccounts.personId, personIds[0])
              : inArray(tables.brokerAccounts.personId, personIds)
          );

        return result;
      }
    }

    if (method === "POST") {
      const body = await readBody(event);
      const { name, brokerName, accountType, currentValue, personId } = body;

      if (!name || !currentValue || !personId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Missing required fields",
        });
      }

      // Verify that the person belongs to the authenticated user's household
      const authorizedPerson = await verifyPersonAccess(
        parseInt(personId),
        session.user.id
      );

      if (!authorizedPerson) {
        throw createError({
          statusCode: 403,
          statusMessage:
            "Access denied: Person does not belong to your household",
        });
      }

      const db = useDrizzle();

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

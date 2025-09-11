import { eq, inArray } from "drizzle-orm";
import { auth } from "~~/lib/auth";
import { verifyPersonAccess, getUserPersons } from "../../utils/authorization";

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

    const method = getMethod(event);

    if (method === "GET") {
      const query = getQuery(event);
      const personId = query.personId as string;

      if (personId) {
        // Get savings accounts for specific person with authorization
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

        const result = await db
          .select()
          .from(tables.savingsAccounts)
          .where(eq(tables.savingsAccounts.personId, parseInt(personId)));

        return result;
      } else {
        // Get all savings accounts for all persons in the user's household
        const userPersons = await getUserPersons(session.user.id);

        if (userPersons.length === 0) {
          return [];
        }

        const personIds = userPersons.map((p) => p.id);
        const result = await db
          .select()
          .from(tables.savingsAccounts)
          .where(
            personIds.length === 1
              ? eq(tables.savingsAccounts.personId, personIds[0])
              : inArray(tables.savingsAccounts.personId, personIds)
          );

        return result;
      }
    }

    if (method === "POST") {
      const body = await readBody(event);
      const { name, currentBalance, interestRate, accountType, personId } =
        body;

      if (!name || !currentBalance || !personId) {
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

      const result = await db
        .insert(tables.savingsAccounts)
        .values({
          name,
          currentBalance: currentBalance.toString(),
          interestRate: interestRate ? interestRate.toString() : null,
          accountType,
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

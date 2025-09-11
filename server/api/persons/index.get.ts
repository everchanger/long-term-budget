import { auth } from "~~/lib/auth";
import { getUserPersons } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
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

  try {
    const db = useDrizzle();

    // Get query parameters
    const query = getQuery(event);
    const householdId = query.householdId ? Number(query.householdId) : null;

    // If householdId is provided, filter by it but ensure user has access
    if (householdId) {
      // Verify household belongs to user
      const [householdAccess] = await db
        .select({ id: tables.households.id })
        .from(tables.households)
        .where(
          and(
            eq(tables.households.id, householdId),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!householdAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: "Access denied: Household does not belong to you",
        });
      }

      const householdPersons = await db
        .select({
          id: tables.persons.id,
          name: tables.persons.name,
          age: tables.persons.age,
          householdId: tables.persons.householdId,
          createdAt: tables.persons.createdAt,
        })
        .from(tables.persons)
        .where(eq(tables.persons.householdId, householdId))
        .orderBy(tables.persons.createdAt);

      return householdPersons;
    }

    // Otherwise return all persons that belong to the user's households
    const userPersons = await getUserPersons(session.user.id);
    return userPersons;
  } catch (error) {
    console.error("Error fetching persons:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch persons",
    });
  }
});

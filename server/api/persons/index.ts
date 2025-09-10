import { auth } from "@s/utils/auth";
import { getUserPersons } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
  // Get session for authorization
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
    if (event.node.req.method === "GET") {
      // Get all persons that belong to the authenticated user's households
      const persons = await getUserPersons(session.user.id);

      return persons;
    }

    if (event.node.req.method === "POST") {
      // Create a new person
      const body = await readBody(event);
      const { name, age, household_id } = body;

      if (!name || !household_id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Name and household_id are required",
        });
      }

      const db = useDrizzle();

      // Verify household exists and belongs to the user
      const [householdExists] = await db
        .select({ id: tables.households.id })
        .from(tables.households)
        .where(
          and(
            eq(tables.households.id, household_id),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!householdExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "Household not found or access denied",
        });
      }

      const [newPerson] = await db
        .insert(tables.persons)
        .values({
          name,
          age: age || null,
          householdId: household_id,
        })
        .returning();

      return newPerson;
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    console.error("Database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database operation failed",
    });
  }
});

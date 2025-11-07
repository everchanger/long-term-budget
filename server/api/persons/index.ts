import { verifyHouseholdAccessOrThrow } from "../../utils/authorization";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const db = useDrizzle();

  if (event.node.req.method === "GET") {
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    try {
      // Get all persons that belong to the authenticated user's households
      const persons = await db
        .select({
          id: tables.persons.id,
          name: tables.persons.name,
          age: tables.persons.age,
          householdId: tables.persons.householdId,
          createdAt: tables.persons.createdAt,
          householdName: tables.households.name,
        })
        .from(tables.persons)
        .innerJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(eq(tables.households.userId, session.user.id))
        .orderBy(tables.persons.name);

      return persons;
    } catch (error) {
      // Re-throw HTTP errors as-is
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      console.error("Database error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Database operation failed",
      });
    }
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

    // Verify household exists and belongs to the user
    try {
      await verifyHouseholdAccessOrThrow(session, household_id, db);
    } catch (error) {
      // Convert 404 to 400 for POST requests (invalid input)
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 404
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Household not found or access denied",
        });
      }
      throw error;
    }

    try {
      const [newPerson] = await db
        .insert(tables.persons)
        .values({
          name,
          age: age || null,
          householdId: household_id,
        })
        .returning();

      return newPerson;
    } catch (error) {
      // Re-throw known errors
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      console.error("Database error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Database operation failed",
      });
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

import { parseIdParam } from "../../utils/api-helpers";

export default defineEventHandler(async (event) => {
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "You must be logged in to access households",
    });
  }

  const householdIdNum = parseIdParam(event, "id", "Household ID is required");

  const method = getMethod(event);
  const db = useDrizzle();

  try {
    if (method === "GET") {
      // Get specific household with owner info - only if it belongs to the current user
      const [household] = await db
        .select({
          id: tables.households.id,
          name: tables.households.name,
          userId: tables.households.userId,
          createdAt: tables.households.createdAt,
          ownerName: tables.users.name,
        })
        .from(tables.households)
        .leftJoin(tables.users, eq(tables.households.userId, tables.users.id))
        .where(
          and(
            eq(tables.households.id, householdIdNum),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!household) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Household not found or access denied",
        });
      }

      // Get persons in this household
      const persons = await db
        .select()
        .from(tables.persons)
        .where(eq(tables.persons.householdId, householdIdNum))
        .orderBy(tables.persons.createdAt);

      return {
        ...household,
        persons,
      };
    }

    if (method === "PUT") {
      // Update household - only if it belongs to the current user
      const body = await readBody(event);
      const { name } = body;

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          message: "Name is required",
        });
      }

      const [updatedHousehold] = await db
        .update(tables.households)
        .set({ name })
        .where(
          and(
            eq(tables.households.id, householdIdNum),
            eq(tables.households.userId, session.user.id)
          )
        )
        .returning();

      if (!updatedHousehold) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Household not found or access denied",
        });
      }

      return updatedHousehold;
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
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

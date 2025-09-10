import { auth } from "@s/utils/auth";

export default defineEventHandler(async (event) => {
  const householdId = parseInt(getRouterParam(event, "id") || "0");

  if (!householdId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid household ID",
    });
  }

  // Get session to verify user authentication
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - please sign in",
    });
  }

  const db = useDrizzle();

  try {
    if (event.node.req.method === "GET") {
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
            eq(tables.households.id, householdId),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!household) {
        throw createError({
          statusCode: 404,
          statusMessage: "Household not found or access denied",
        });
      }

      // Get persons in this household
      const persons = await db
        .select()
        .from(tables.persons)
        .where(eq(tables.persons.householdId, householdId))
        .orderBy(tables.persons.createdAt);

      return {
        ...household,
        persons,
      };
    }

    if (event.node.req.method === "PUT") {
      // Update household - only if it belongs to the current user
      const body = await readBody(event);
      const { name } = body;

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Name is required",
        });
      }

      const [updatedHousehold] = await db
        .update(tables.households)
        .set({ name })
        .where(
          and(
            eq(tables.households.id, householdId),
            eq(tables.households.userId, session.user.id)
          )
        )
        .returning();

      if (!updatedHousehold) {
        throw createError({
          statusCode: 404,
          statusMessage: "Household not found or access denied",
        });
      }

      return updatedHousehold;
    }

    throw createError({
      statusCode: 405,
      statusMessage:
        "Method not allowed - only GET and PUT requests are supported",
    });
  } catch (error) {
    console.error("Database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database operation failed",
    });
  }
});

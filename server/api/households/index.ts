import { auth } from "@s/utils/auth";

export default defineEventHandler(async (event) => {
  try {
    // Only allow GET requests
    assertMethod(event, "GET");

    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "You must be logged in to view households",
      });
    }

    const db = useDrizzle();

    // Get households for the authenticated user
    const userHouseholds = await db
      .select({
        id: tables.households.id,
        name: tables.households.name,
        userId: tables.households.userId,
        createdAt: tables.households.createdAt,
        ownerName: tables.users.name,
      })
      .from(tables.households)
      .innerJoin(tables.users, eq(tables.households.userId, tables.users.id))
      .where(eq(tables.households.userId, session.user.id));

    return userHouseholds;
  } catch (error) {
    // If it's already an H3 error, re-throw it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Otherwise, wrap it as an internal server error
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
      message: "An unexpected error occurred",
    });
  }
});

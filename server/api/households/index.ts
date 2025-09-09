import { db } from "../../../db";
import { households, users } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../../utils/auth";

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

    // Get households for the authenticated user
    const userHouseholds = await db
      .select({
        id: households.id,
        name: households.name,
        userId: households.userId,
        createdAt: households.createdAt,
        ownerName: users.name,
      })
      .from(households)
      .innerJoin(users, eq(households.userId, users.id))
      .where(eq(households.userId, session.user.id));

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

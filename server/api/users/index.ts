import { insertUserSchema } from "~~/database/validation-schemas";
import { desc } from "drizzle-orm";
import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();

  try {
    if (event.node.req.method === "GET") {
      // Get all users
      const users = await db
        .select({
          id: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          createdAt: tables.users.createdAt,
        })
        .from(tables.users)
        .orderBy(desc(tables.users.createdAt));

      return successResponse(users);
    }

    if (event.node.req.method === "POST") {
      // Create a new user
      const body = await readBody(event);

      // Validate the request body using the generated schema
      const validatedData = insertUserSchema.parse(body);

      const [newUser] = await db
        .insert(tables.users)
        .values(validatedData)
        .returning({
          id: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          createdAt: tables.users.createdAt,
        });

      setResponseStatus(event, 201);
      return successResponse(newUser);
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: "errors" in error ? error.errors : undefined,
      });
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database operation failed",
    });
  }
});

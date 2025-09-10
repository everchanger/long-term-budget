import { insertUserSchema } from "@s/database/validation-schemas";
import { desc } from "drizzle-orm";

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

      return users;
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
      return newUser;
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation failed",
        data: error.errors,
      });
    }

    if (error.statusCode) {
      throw error;
    }

    console.error("Database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database operation failed",
    });
  }
});

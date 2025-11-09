import { updateUserSchema } from "~~/database/validation-schemas";
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid user ID",
    });
  }

  const db = useDrizzle();
  const method = getMethod(event);

  try {
    if (method === "GET") {
      // Get specific user
      const [user] = await db
        .select({
          id: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          createdAt: tables.users.createdAt,
        })
        .from(tables.users)
        .where(eq(tables.users.id, userId));

      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
        });
      }

      return successResponse(user);
    }

    if (method === "PUT") {
      // Update user
      const body = await readBody(event);

      // Validate the request body using the generated schema
      const validatedData = updateUserSchema.parse(body);

      const [updatedUser] = await db
        .update(tables.users)
        .set(validatedData)
        .where(eq(tables.users.id, userId))
        .returning({
          id: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          createdAt: tables.users.createdAt,
        });

      if (!updatedUser) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
        });
      }

      return successResponse(updatedUser);
    }

    if (method === "DELETE") {
      // Delete user
      const [deletedUser] = await db
        .delete(tables.users)
        .where(eq(tables.users.id, userId))
        .returning({ id: tables.users.id });

      if (!deletedUser) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
        });
      }

      setResponseStatus(event, 204);
      return deleteResponse("User deleted successfully");
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

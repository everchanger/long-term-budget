import { auth } from "~~/lib/auth";
import { verifyPersonAccess } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
  const personId = parseInt(getRouterParam(event, "id") || "0");

  if (!personId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid person ID",
    });
  }

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
      // Verify person belongs to user's household
      const authorizedPerson = await verifyPersonAccess(
        personId,
        session.user.id
      );
      if (!authorizedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: "Person not found or access denied",
        });
      }

      const db = useDrizzle();

      // Get specific person with household info
      const [person] = await db
        .select({
          id: tables.persons.id,
          name: tables.persons.name,
          age: tables.persons.age,
          householdId: tables.persons.householdId,
          createdAt: tables.persons.createdAt,
          householdName: tables.households.name,
        })
        .from(tables.persons)
        .leftJoin(
          tables.households,
          eq(tables.persons.householdId, tables.households.id)
        )
        .where(eq(tables.persons.id, personId));

      return person;
    }

    if (event.node.req.method === "PUT") {
      // Verify person belongs to user's household
      const authorizedPerson = await verifyPersonAccess(
        personId,
        session.user.id
      );
      if (!authorizedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: "Person not found or access denied",
        });
      }

      // Update person
      const body = await readBody(event);
      const { name, age } = body;

      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: "Name is required",
        });
      }

      const db = useDrizzle();

      const [updatedPerson] = await db
        .update(tables.persons)
        .set({ name, age: age || null })
        .where(eq(tables.persons.id, personId))
        .returning();

      if (!updatedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: "Person not found",
        });
      }

      return updatedPerson;
    }

    if (event.node.req.method === "DELETE") {
      // Verify person belongs to user's household
      const authorizedPerson = await verifyPersonAccess(
        personId,
        session.user.id
      );
      if (!authorizedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: "Person not found or access denied",
        });
      }

      const db = useDrizzle();

      // Delete person
      const [deletedPerson] = await db
        .delete(tables.persons)
        .where(eq(tables.persons.id, personId))
        .returning({ id: tables.persons.id });

      if (!deletedPerson) {
        throw createError({
          statusCode: 404,
          statusMessage: "Person not found",
        });
      }

      return { message: "Person deleted successfully" };
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

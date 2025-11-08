import { parseIdParam } from "../../utils/api-helpers";
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  // Get session from middleware
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const personId = parseIdParam(event, "id", "Invalid person ID");

  const db = useDrizzle();

  if (event.node.req.method === "GET") {
    // Get person and verify ownership through household
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
      .innerJoin(
        tables.households,
        eq(tables.persons.householdId, tables.households.id)
      )
      .where(
        and(
          eq(tables.persons.id, personId),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!person) {
      throw createError({
        statusCode: 404,
        statusMessage: "Person not found or access denied",
      });
    }

    return successResponse(person);
  }

  if (event.node.req.method === "PUT") {
    // Update person - first verify ownership through household
    const body = await readBody(event);
    const { name, age } = body;

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name is required",
      });
    }

    // Verify person belongs to user's household
    const [personExists] = await db
      .select({ id: tables.persons.id })
      .from(tables.persons)
      .innerJoin(
        tables.households,
        eq(tables.persons.householdId, tables.households.id)
      )
      .where(
        and(
          eq(tables.persons.id, personId),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!personExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Person not found or access denied",
      });
    }

    // Update the person
    const [updatedPerson] = await db
      .update(tables.persons)
      .set({ name, age: age || null })
      .where(eq(tables.persons.id, personId))
      .returning({
        id: tables.persons.id,
        name: tables.persons.name,
        age: tables.persons.age,
        householdId: tables.persons.householdId,
        createdAt: tables.persons.createdAt,
      });

    return successResponse(updatedPerson);
  }

  if (event.node.req.method === "DELETE") {
    // Verify person belongs to user's household before deleting
    const [personExists] = await db
      .select({ id: tables.persons.id })
      .from(tables.persons)
      .innerJoin(
        tables.households,
        eq(tables.persons.householdId, tables.households.id)
      )
      .where(
        and(
          eq(tables.persons.id, personId),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!personExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Person not found or access denied",
      });
    }

    // Delete the person
    await db.delete(tables.persons).where(eq(tables.persons.id, personId));

    return deleteResponse("Person deleted successfully");
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

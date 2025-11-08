import { parseIdParam } from "../../utils/api-helpers";
import { verifyHouseholdAccessOrThrow } from "../../utils/authorization";
import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const householdIdNum = parseIdParam(event, "id", "Household ID is required");
  const method = getMethod(event);
  const db = useDrizzle();

  try {
    if (method === "GET") {
      // Verify access to household
      await verifyHouseholdAccessOrThrow(session, householdIdNum, db);

      // Get specific household with owner info
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
        .where(eq(tables.households.id, householdIdNum));

      if (!household) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Household not found",
        });
      }

      // Get persons in this household
      const persons = await db
        .select()
        .from(tables.persons)
        .where(eq(tables.persons.householdId, householdIdNum))
        .orderBy(tables.persons.createdAt);

      return successResponse({
        ...household,
        persons,
      });
    }

    if (method === "PUT") {
      // Verify access to household
      await verifyHouseholdAccessOrThrow(session, householdIdNum, db);

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
        .where(eq(tables.households.id, householdIdNum))
        .returning();

      if (!updatedHousehold) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          message: "Household not found",
        });
      }

      return successResponse(updatedHousehold);
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

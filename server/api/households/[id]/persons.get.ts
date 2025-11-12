import { parseIdParam } from "../../../utils/api-helpers";
import { verifyHouseholdAccessOrThrow } from "../../../utils/authorization";
import { successResponse } from "../../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const db = useDrizzle();
  const householdId = parseIdParam(event, "id", "Household ID is required");

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Verify household exists and belongs to the user
  await verifyHouseholdAccessOrThrow(session, householdId, db);

  try {
    // Get all persons in the household
    const persons = await db
      .select({
        id: tables.persons.id,
        name: tables.persons.name,
        age: tables.persons.age,
        householdId: tables.persons.householdId,
        createdAt: tables.persons.createdAt,
      })
      .from(tables.persons)
      .where(eq(tables.persons.householdId, householdId))
      .orderBy(tables.persons.name);

    return successResponse(persons);
  } catch (error) {
    // Re-throw HTTP errors as-is
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

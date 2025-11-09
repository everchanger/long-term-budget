import {
  getUserPersons,
  verifyPersonAccessOrThrow,
} from "@s/utils/authorization";
import { parseQueryInt } from "../../utils/api-helpers";
import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  // Get session from middleware
  const session = event.context.session;

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const db = useDrizzle();
  const method = getMethod(event);

  if (method === "GET") {
    // Get all income sources for a specific person
    const personId = parseQueryInt(event, "personId");

    if (personId) {
      // Verify person belongs to user's household
      await verifyPersonAccessOrThrow(session, personId, db);

      const incomeSources = await db
        .select()
        .from(tables.incomeSources)
        .where(eq(tables.incomeSources.personId, personId))
        .orderBy(desc(tables.incomeSources.createdAt));

      return successResponse(incomeSources);
    }

    // Get all income sources for all persons in user's households
    const userPersons = await getUserPersons(session.user.id);
    if (userPersons.length === 0) {
      return successResponse([]);
    }

    const personIds = userPersons.map((p) => p.id);
    const incomeSources = await db
      .select()
      .from(tables.incomeSources)
      .where(
        personIds.length === 1
          ? eq(tables.incomeSources.personId, personIds[0])
          : inArray(tables.incomeSources.personId, personIds)
      )
      .orderBy(desc(tables.incomeSources.createdAt));

    return successResponse(incomeSources);
  }

  if (method === "POST") {
    // Create a new income source
    const body = await readBody(event);
    const { personId, name, amount, frequency, startDate, endDate, isActive } =
      body;

    if (!name || !amount || !frequency || !personId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name, amount, frequency, and personId are required",
      });
    }

    // Verify person belongs to user's household
    await verifyPersonAccessOrThrow(session, personId, db);

    const [newIncomeSource] = await db
      .insert(tables.incomeSources)
      .values({
        personId,
        name,
        amount,
        frequency,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      })
      .returning();

    return successResponse(newIncomeSource);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

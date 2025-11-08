import { getUserPersons } from "@s/utils/authorization";
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

  if (event.node.req.method === "GET") {
    // Get all income sources for a specific person
    const personId = parseQueryInt(event, "personId");

    if (personId) {
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
          statusCode: 403,
          statusMessage:
            "Access denied: Person does not belong to your household",
        });
      }

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

  if (event.node.req.method === "POST") {
    // Create a new income source
    const body = await readBody(event);
    const {
      person_id,
      name,
      amount,
      frequency,
      start_date,
      end_date,
      is_active,
    } = body;

    if (!name || !amount || !frequency || !person_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name, amount, frequency, and person_id are required",
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
          eq(tables.persons.id, person_id),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!personExists) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Access denied: Person does not belong to your household",
      });
    }

    const [newIncomeSource] = await db
      .insert(tables.incomeSources)
      .values({
        personId: person_id,
        name,
        amount,
        frequency,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        isActive: is_active ?? true,
      })
      .returning();

    return successResponse(newIncomeSource);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

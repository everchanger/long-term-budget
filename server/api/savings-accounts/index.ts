import { successResponse, deleteResponse } from "../../utils/api-response";
import { eq, inArray, and } from "drizzle-orm";
import { getUserPersons } from "../../utils/authorization";
import { parseQueryInt } from "../../utils/api-helpers";

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
    const personId = parseQueryInt(event, "personId");

    if (personId) {
      // Verify that the person belongs to the authenticated user's household
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

      const result = await db
        .select()
        .from(tables.savingsAccounts)
        .where(eq(tables.savingsAccounts.personId, personId));

      return successResponse(result);
    } else {
      // Get all savings accounts for all persons in the user's household
      const userPersons = await getUserPersons(session.user.id);

      if (userPersons.length === 0) {
        return successResponse([]);
      }

      const personIds = userPersons.map((p) => p.id);
      const result = await db
        .select()
        .from(tables.savingsAccounts)
        .where(
          personIds.length === 1
            ? eq(tables.savingsAccounts.personId, personIds[0])
            : inArray(tables.savingsAccounts.personId, personIds)
        );

      return successResponse(result);
    }
  }

  if (method === "POST") {
    const body = await readBody(event);
    const {
      name,
      currentBalance,
      interestRate,
      accountType,
      personId,
      monthlyDeposit,
    } = body;

    if (!name || !currentBalance || !personId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    // Verify that the person belongs to the authenticated user's household
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

    const [result] = await db
      .insert(tables.savingsAccounts)
      .values({
        name,
        currentBalance,
        interestRate: interestRate || null,
        monthlyDeposit: monthlyDeposit || null,
        accountType,
        personId: personId,
      })
      .returning();

    return successResponse(result);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

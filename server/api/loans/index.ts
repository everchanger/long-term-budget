import { successResponse } from "../../utils/api-response";
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

  const method = getMethod(event);

  if (method === "GET") {
    const personId = parseQueryInt(event, "personId", true)!;

    // Verify that the person belongs to the authenticated user's household
    const db = useDrizzle();
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
      .from(tables.loans)
      .where(eq(tables.loans.personId, personId));

    // Convert decimal interest rates to percentages for display
    const converted = result.map((loan) => ({
      ...loan,
      interestRate: String(
        Math.round(Number(loan.interestRate) * 100 * 100) / 100
      ),
    }));

    return successResponse(converted);
  }

  if (method === "POST") {
    const body = await readBody(event);
    const {
      name,
      originalAmount,
      currentBalance,
      interestRate,
      monthlyPayment,
      loanType,
      startDate,
      endDate,
      personId,
    } = body;

    if (
      !name ||
      !originalAmount ||
      !currentBalance ||
      !interestRate ||
      !monthlyPayment ||
      !personId
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    // Verify that the person belongs to the authenticated user's household
    const db = useDrizzle();
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
      .insert(tables.loans)
      .values({
        name,
        originalAmount,
        currentBalance,
        interestRate: String(Number(interestRate) / 100), // Convert percentage to decimal
        monthlyPayment,
        loanType,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        personId: personId,
      })
      .returning();

    // Convert decimal interest rate back to percentage for response
    const converted = {
      ...result[0],
      interestRate: String(
        Math.round(Number(result[0].interestRate) * 100 * 100) / 100
      ),
    };

    return successResponse(converted);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

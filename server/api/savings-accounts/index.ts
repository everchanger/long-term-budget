import { successResponse } from "../../utils/api-response";
import { eq, inArray } from "drizzle-orm";
import {
  getUserPersons,
  verifyPersonAccessOrThrow,
} from "../../utils/authorization";
import { parseQueryInt } from "../../utils/api-helpers";
import {
  percentageToDecimal,
  convertInterestRateForDisplay,
} from "../../utils/interest-rate";

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
      await verifyPersonAccessOrThrow(session, personId, db);

      const result = await db
        .select()
        .from(tables.savingsAccounts)
        .where(eq(tables.savingsAccounts.personId, personId));

      // Convert decimal interest rates to percentages for display
      const converted = result.map(convertInterestRateForDisplay);

      return successResponse(converted);
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

      // Convert decimal interest rates to percentages for display
      const converted = result.map(convertInterestRateForDisplay);

      return successResponse(converted);
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
    await verifyPersonAccessOrThrow(session, personId, db);

    const [result] = await db
      .insert(tables.savingsAccounts)
      .values({
        name,
        currentBalance,
        interestRate: interestRate ? percentageToDecimal(interestRate) : null, // Convert percentage to decimal
        monthlyDeposit: monthlyDeposit || null,
        accountType,
        personId: personId,
      })
      .returning();

    // Convert decimal interest rate back to percentage for response
    const converted = convertInterestRateForDisplay(result);

    return successResponse(converted);
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

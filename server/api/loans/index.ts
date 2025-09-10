import { auth } from "@s/utils/auth";
import { verifyPersonAccess } from "@s/utils/authorization";

export default defineEventHandler(async (event) => {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const method = getMethod(event);

  if (method === "GET") {
    const query = getQuery(event);
    const personId = query.personId as string;

    if (!personId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Person ID is required",
      });
    }

    try {
      // Verify that the person belongs to the authenticated user's household
      const authorizedPerson = await verifyPersonAccess(
        parseInt(personId),
        session.user.id
      );

      if (!authorizedPerson) {
        throw createError({
          statusCode: 403,
          statusMessage:
            "Access denied: Person does not belong to your household",
        });
      }

      const db = useDrizzle();

      const result = await db
        .select()
        .from(tables.loans)
        .where(eq(tables.loans.personId, parseInt(personId)));

      return result;
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error; // Re-throw HTTP errors
      }
      console.error("Failed to fetch loans:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch loans",
      });
    }
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

    try {
      // Verify that the person belongs to the authenticated user's household
      const authorizedPerson = await verifyPersonAccess(
        parseInt(personId),
        session.user.id
      );

      if (!authorizedPerson) {
        throw createError({
          statusCode: 403,
          statusMessage:
            "Access denied: Person does not belong to your household",
        });
      }

      const db = useDrizzle();

      const result = await db
        .insert(tables.loans)
        .values({
          name,
          originalAmount: originalAmount.toString(),
          currentBalance: currentBalance.toString(),
          interestRate: interestRate.toString(),
          monthlyPayment: monthlyPayment.toString(),
          loanType,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          personId: parseInt(personId),
        })
        .returning();

      return result[0];
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error; // Re-throw HTTP errors
      }
      console.error("Failed to create loan:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create loan",
      });
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

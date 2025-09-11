import { auth } from "~~/lib/auth";
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

  const loanId = getRouterParam(event, "id");
  if (!loanId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Loan ID is required",
    });
  }

  const db = useDrizzle();

  // First get the loan to check which person it belongs to
  const existingLoan = await db
    .select()
    .from(tables.loans)
    .where(eq(tables.loans.id, parseInt(loanId)))
    .limit(1);

  if (existingLoan.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Loan not found",
    });
  }

  // Verify that the loan's person belongs to the authenticated user's household
  const authorizedPerson = await verifyPersonAccess(
    existingLoan[0].personId,
    session.user.id
  );

  if (!authorizedPerson) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied: Loan does not belong to your household",
    });
  }

  const method = getMethod(event);

  if (method === "PUT") {
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
    } = body;

    if (
      !name ||
      !originalAmount ||
      !currentBalance ||
      !interestRate ||
      !monthlyPayment
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    try {
      const result = await db
        .update(tables.loans)
        .set({
          name,
          originalAmount: originalAmount.toString(),
          currentBalance: currentBalance.toString(),
          interestRate: interestRate.toString(),
          monthlyPayment: monthlyPayment.toString(),
          loanType,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
        })
        .where(eq(tables.loans.id, parseInt(loanId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Loan not found",
        });
      }

      return result[0];
    } catch (error) {
      console.error("Failed to update loan:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update loan",
      });
    }
  }

  if (method === "DELETE") {
    try {
      // TODO: Add authorization check to ensure loan belongs to user's household
      const result = await db
        .delete(tables.loans)
        .where(eq(tables.loans.id, parseInt(loanId)))
        .returning();

      if (result.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Loan not found",
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to delete loan:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to delete loan",
      });
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

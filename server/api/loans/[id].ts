import { successResponse, deleteResponse } from "../../utils/api-response";
import { parseIdParam } from "../../utils/api-helpers";
import { verifyPersonAccessOrThrow } from "../../utils/authorization";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const loanIdInt = parseIdParam(event, "id", "Loan ID is required");
  const db = useDrizzle();

  // Get the loan to check if it exists
  const [existingLoan] = await db
    .select()
    .from(tables.loans)
    .where(eq(tables.loans.id, loanIdInt))
    .limit(1);

  if (!existingLoan) {
    throw createError({
      statusCode: 404,
      statusMessage: "Loan not found",
    });
  }

  // Verify that the loan's person belongs to the authenticated user's household
  await verifyPersonAccessOrThrow(session, existingLoan.personId, db);

  const method = getMethod(event);

  if (method === "GET") {
    // Return the loan
    return successResponse(existingLoan);
  }

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

    const [updatedLoan] = await db
      .update(tables.loans)
      .set({
        name,
        originalAmount,
        currentBalance,
        interestRate,
        monthlyPayment,
        loanType,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      })
      .where(eq(tables.loans.id, loanIdInt))
      .returning();

    if (!updatedLoan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Loan not found",
      });
    }

    return successResponse(updatedLoan);
  }

  if (method === "DELETE") {
    const [deletedLoan] = await db
      .delete(tables.loans)
      .where(eq(tables.loans.id, loanIdInt))
      .returning();

    if (!deletedLoan) {
      throw createError({
        statusCode: 404,
        statusMessage: "Loan not found",
      });
    }

    return deleteResponse("Loan deleted successfully");
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

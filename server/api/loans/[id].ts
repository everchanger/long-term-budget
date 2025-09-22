export default defineEventHandler(async (event) => {
  // Get session from middleware
  const session = event.context.session;

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

  // Validate that ID is a valid integer
  const loanIdInt = parseInt(loanId);
  if (isNaN(loanIdInt)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Loan ID is required",
    });
  }

  const db = useDrizzle();

  // First get the loan to check if it exists
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

  // Then verify that the loan's person belongs to the authenticated user's household
  const [personExists] = await db
    .select({ id: tables.persons.id })
    .from(tables.persons)
    .innerJoin(
      tables.households,
      eq(tables.persons.householdId, tables.households.id)
    )
    .where(
      and(
        eq(tables.persons.id, existingLoan.personId),
        eq(tables.households.userId, session.user.id)
      )
    );

  if (!personExists) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied: Loan does not belong to your household",
    });
  }

  const method = getMethod(event);

  if (method === "GET") {
    // Return the loan
    return existingLoan;
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
        originalAmount: originalAmount.toString(),
        currentBalance: currentBalance.toString(),
        interestRate: interestRate.toString(),
        monthlyPayment: monthlyPayment.toString(),
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

    return updatedLoan;
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

    return { message: "Loan deleted successfully" };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

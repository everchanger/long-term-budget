import { parseIdParam } from "../../utils/api-helpers";
import { verifyPersonAccessOrThrow } from "../../utils/authorization";
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const incomeSourceId = parseIdParam(
    event,
    "id",
    "Income source ID is required"
  );
  const db = useDrizzle();

  // Get the income source to check if it exists
  const [existingIncomeSource] = await db
    .select()
    .from(tables.incomeSources)
    .where(eq(tables.incomeSources.id, incomeSourceId))
    .limit(1);

  if (!existingIncomeSource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Income source not found",
    });
  }

  // Verify that the income source's person belongs to the authenticated user's household
  await verifyPersonAccessOrThrow(session, existingIncomeSource.personId, db);

  if (event.node.req.method === "GET") {
    // Return the income source
    return successResponse(existingIncomeSource);
  }

  if (event.node.req.method === "PUT") {
    // Update income source
    const body = await readBody(event);
    const { name, amount, frequency, start_date, end_date, is_active } = body;

    if (!name || !amount || !frequency) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name, amount, and frequency are required",
      });
    }

    const [updatedIncomeSource] = await db
      .update(tables.incomeSources)
      .set({
        name,
        amount: amount.toString(),
        frequency,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        isActive: is_active ?? true,
      })
      .where(eq(tables.incomeSources.id, incomeSourceId))
      .returning();

    if (!updatedIncomeSource) {
      throw createError({
        statusCode: 404,
        statusMessage: "Income source not found",
      });
    }

    return successResponse(updatedIncomeSource);
  }

  if (event.node.req.method === "DELETE") {
    // Delete income source
    const [deletedIncomeSource] = await db
      .delete(tables.incomeSources)
      .where(eq(tables.incomeSources.id, incomeSourceId))
      .returning();

    if (!deletedIncomeSource) {
      throw createError({
        statusCode: 404,
        statusMessage: "Income source not found",
      });
    }

    return deleteResponse("Income source deleted successfully");
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

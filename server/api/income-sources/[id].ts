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

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Income source ID is required",
    });
  }

  const db = useDrizzle();

  // First get the income source to check which person it belongs to
  const [existingIncomeSource] = await db
    .select()
    .from(tables.incomeSources)
    .where(eq(tables.incomeSources.id, parseInt(id)))
    .limit(1);

  if (!existingIncomeSource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Income source not found",
    });
  }

  // Verify that the income source's person belongs to the authenticated user's household
  const authorizedPerson = await verifyPersonAccess(
    existingIncomeSource.personId,
    session.user.id
  );

  if (!authorizedPerson) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "Access denied: Income source does not belong to your household",
    });
  }

  try {
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
        .where(eq(tables.incomeSources.id, parseInt(id)))
        .returning();

      if (!updatedIncomeSource) {
        throw createError({
          statusCode: 404,
          statusMessage: "Income source not found",
        });
      }

      return updatedIncomeSource;
    }

    if (event.node.req.method === "DELETE") {
      // Delete income source
      const [deletedIncomeSource] = await db
        .delete(tables.incomeSources)
        .where(eq(tables.incomeSources.id, parseInt(id)))
        .returning();

      if (!deletedIncomeSource) {
        throw createError({
          statusCode: 404,
          statusMessage: "Income source not found",
        });
      }

      return { message: "Income source deleted successfully" };
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    console.error("Income source API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});

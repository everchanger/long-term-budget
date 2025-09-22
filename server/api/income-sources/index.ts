import { verifyPersonAccess, getUserPersons } from "@s/utils/authorization";

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
    const query = getQuery(event);
    const personId = query.personId as string;

    if (personId) {
      // Verify person belongs to user's household
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

      const incomeSources = await db
        .select()
        .from(tables.incomeSources)
        .where(eq(tables.incomeSources.personId, parseInt(personId)))
        .orderBy(desc(tables.incomeSources.createdAt));

      return incomeSources;
    }

    // Get all income sources for all persons in user's households
    const userPersons = await getUserPersons(session.user.id);
    if (userPersons.length === 0) {
      return [];
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

    return incomeSources;
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
    const authorizedPerson = await verifyPersonAccess(
      person_id,
      session.user.id
    );

    if (!authorizedPerson) {
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
        amount: amount.toString(),
        frequency,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        isActive: is_active ?? true,
      })
      .returning();

    return newIncomeSource;
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});

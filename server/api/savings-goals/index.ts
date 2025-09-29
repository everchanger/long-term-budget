import { eq, and } from "drizzle-orm";
import { insertSavingsGoalSchema } from "../../../database/validation-schemas";
import { enrichSavingsGoalsWithProgress } from "../../utils/savingsGoalCalculations";

export default defineEventHandler(async (event) => {
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
    const query = getQuery(event);
    const householdId = query.householdId as string;

    if (householdId) {
      // Verify that the household belongs to the authenticated user
      const [householdExists] = await db
        .select({ id: tables.households.id })
        .from(tables.households)
        .where(
          and(
            eq(tables.households.id, parseInt(householdId)),
            eq(tables.households.userId, session.user.id)
          )
        );

      if (!householdExists) {
        throw createError({
          statusCode: 403,
          statusMessage: "Access denied: Household does not belong to you",
        });
      }

      const goals = await db
        .select()
        .from(tables.savingsGoals)
        .where(eq(tables.savingsGoals.householdId, parseInt(householdId)))
        .orderBy(tables.savingsGoals.createdAt);

      // Enrich goals with calculated progress data
      const enrichedGoals = await enrichSavingsGoalsWithProgress(
        goals,
        parseInt(householdId),
        db
      );

      return enrichedGoals;
    } else {
      // Get all savings goals for all households of the user
      const result = await db
        .select()
        .from(tables.savingsGoals)
        .innerJoin(
          tables.households,
          eq(tables.savingsGoals.householdId, tables.households.id)
        )
        .where(eq(tables.households.userId, session.user.id))
        .orderBy(tables.savingsGoals.createdAt);

      // Group by household and enrich each group
      const goalsByHousehold = result.reduce((acc, item) => {
        const householdId = item.savings_goals.householdId;
        if (!acc[householdId]) {
          acc[householdId] = [];
        }
        acc[householdId].push(item.savings_goals);
        return acc;
      }, {} as Record<number, any[]>);

      const enrichedResults = [];
      for (const [householdId, goals] of Object.entries(goalsByHousehold)) {
        const enrichedGoals = await enrichSavingsGoalsWithProgress(
          goals,
          parseInt(householdId),
          db
        );
        enrichedResults.push(...enrichedGoals);
      }

      return enrichedResults;
    }
  }

  if (method === "POST") {
    const body = await readBody(event);

    // Validate using our Zod schema
    const validatedData = insertSavingsGoalSchema.parse(body);

    // Verify that the household belongs to the authenticated user
    const [householdExists] = await db
      .select({ id: tables.households.id })
      .from(tables.households)
      .where(
        and(
          eq(tables.households.id, validatedData.householdId),
          eq(tables.households.userId, session.user.id)
        )
      );

    if (!householdExists) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: Household does not belong to you",
      });
    }

    const [result] = await db
      .insert(tables.savingsGoals)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        targetDate: validatedData.targetDate,
        priority: validatedData.priority || 1,
        category: validatedData.category,
        householdId: validatedData.householdId,
      })
      .returning();

    return result;
  }

  throw createError({
    statusCode: 405,
    statusMessage: "Method not allowed",
  });
});
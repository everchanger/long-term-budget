import { successResponse } from "../utils/api-response";

export default defineEventHandler(async (_event) => {
  try {
    const db = useDrizzle();

    // Get counts for each table
    const [usersCount] = await db.select({ count: count() }).from(tables.users);
    const [householdsCount] = await db
      .select({ count: count() })
      .from(tables.households);
    const [personsCount] = await db
      .select({ count: count() })
      .from(tables.persons);
    const [scenariosCount] = await db
      .select({ count: count() })
      .from(tables.scenarios);

    return successResponse({
      users: usersCount.count,
      households: householdsCount.count,
      persons: personsCount.count,
      scenarios: scenariosCount.count,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch statistics",
    });
  }
});

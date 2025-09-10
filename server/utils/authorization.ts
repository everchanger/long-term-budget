export interface AuthorizedPerson {
  id: number;
  name: string;
  householdId: number;
  userId: string;
}

/**
 * Verify that a person belongs to the authenticated user's household
 */
export async function verifyPersonAccess(
  personId: number,
  userId: string
): Promise<AuthorizedPerson | null> {
  try {
    const db = useDrizzle();
    const result = await db
      .select({
        id: tables.persons.id,
        name: tables.persons.name,
        householdId: tables.persons.householdId,
        userId: tables.households.userId,
      })
      .from(tables.persons)
      .innerJoin(
        tables.households,
        eq(tables.persons.householdId, tables.households.id)
      )
      .where(
        and(
          eq(tables.persons.id, personId),
          eq(tables.households.userId, userId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as AuthorizedPerson;
  } catch (error) {
    console.error("Error verifying person access:", error);
    return null;
  }
}

/**
 * Get all persons that belong to the authenticated user's households
 */
export async function getUserPersons(
  userId: string
): Promise<AuthorizedPerson[]> {
  try {
    const db = useDrizzle();
    const result = await db
      .select({
        id: tables.persons.id,
        name: tables.persons.name,
        householdId: tables.persons.householdId,
        userId: tables.households.userId,
      })
      .from(tables.persons)
      .innerJoin(
        tables.households,
        eq(tables.persons.householdId, tables.households.id)
      )
      .where(eq(tables.households.userId, userId))
      .orderBy(tables.persons.name);

    return result as AuthorizedPerson[];
  } catch (error) {
    console.error("Error fetching user persons:", error);
    return [];
  }
}

export default {
  verifyPersonAccess,
  getUserPersons,
};

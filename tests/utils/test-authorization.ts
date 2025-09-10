import { testDb } from "../../db/test-db";
import { persons, households } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export interface AuthorizedPerson {
  id: number;
  name: string;
  householdId: number;
  userId: string;
}

/**
 * Test version - Verify that a person belongs to the authenticated user's household
 */
export async function verifyPersonAccess(
  personId: number,
  userId: string
): Promise<AuthorizedPerson | null> {
  try {
    const result = await testDb
      .select({
        id: persons.id,
        name: persons.name,
        householdId: persons.householdId,
        userId: households.userId,
      })
      .from(persons)
      .innerJoin(households, eq(persons.householdId, households.id))
      .where(and(eq(persons.id, personId), eq(households.userId, userId)))
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
 * Test version - Get all persons that belong to the authenticated user's households
 */
export async function getUserPersons(
  userId: string
): Promise<AuthorizedPerson[]> {
  try {
    const result = await testDb
      .select({
        id: persons.id,
        name: persons.name,
        householdId: persons.householdId,
        userId: households.userId,
      })
      .from(persons)
      .innerJoin(households, eq(persons.householdId, households.id))
      .where(eq(households.userId, userId));

    return result as AuthorizedPerson[];
  } catch (error) {
    console.error("Error getting user persons:", error);
    return [];
  }
}

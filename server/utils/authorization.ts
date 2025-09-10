import { db } from "../../db";
import { persons, households } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../db/schema";

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
  userId: string,
  dbInstance: NodePgDatabase<typeof schema> = db
): Promise<AuthorizedPerson | null> {
  try {
    const result = await dbInstance
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
 * Get all persons that belong to the authenticated user's households
 */
export async function getUserPersons(
  userId: string,
  dbInstance: NodePgDatabase<typeof schema> = db
): Promise<AuthorizedPerson[]> {
  try {
    const result = await dbInstance
      .select({
        id: persons.id,
        name: persons.name,
        householdId: persons.householdId,
        userId: households.userId,
      })
      .from(persons)
      .innerJoin(households, eq(persons.householdId, households.id))
      .where(eq(households.userId, userId))
      .orderBy(persons.name);

    return result as AuthorizedPerson[];
  } catch (error) {
    console.error("Error fetching user persons:", error);
    return [];
  }
}

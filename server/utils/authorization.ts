// ============================================================================
// Type Definitions
// ============================================================================

/** User session type for authorization checks */
export type UserSession = {
  user?: {
    id?: string;
  };
};

export interface AuthorizedPerson {
  id: number;
  name: string;
  householdId: number;
  userId: string;
}

export interface AuthorizedHousehold {
  id: number;
  name: string;
  userId: string;
  createdAt: Date;
}

// ============================================================================
// Modern Authorization Utilities
// ============================================================================

/**
 * Verify that a person belongs to the authenticated user's household.
 * Throws a 403 error if access is denied.
 *
 * @param session - The user session from event.context.session
 * @param personId - The ID of the person to verify access to
 * @param db - The Drizzle database instance
 * @returns The authorized person with household info
 * @throws createError with statusCode 403 if access denied
 *
 * @example
 * const person = await verifyPersonAccessOrThrow(event.context.session, personId, db);
 * // Use person.id, person.name, person.householdId, etc.
 */
export async function verifyPersonAccessOrThrow(
  session: UserSession,
  personId: number,
  db: ReturnType<typeof useDrizzle>
): Promise<AuthorizedPerson> {
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const [person] = await db
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
    .where(eq(tables.persons.id, personId))
    .limit(1);

  if (!person || person.userId !== session.user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied: Person does not belong to your household",
    });
  }

  return person;
}

/**
 * Verify that a household belongs to the authenticated user.
 * Throws a 403/404 error if access is denied or household not found.
 *
 * @param session - The user session from event.context.session
 * @param householdId - The ID of the household to verify access to
 * @param db - The Drizzle database instance
 * @returns The authorized household
 * @throws createError with statusCode 403/404 if access denied or not found
 *
 * @example
 * const household = await verifyHouseholdAccessOrThrow(event.context.session, householdId, db);
 */
export async function verifyHouseholdAccessOrThrow(
  session: UserSession,
  householdId: number,
  db: ReturnType<typeof useDrizzle>
): Promise<AuthorizedHousehold> {
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const [household] = await db
    .select({
      id: tables.households.id,
      name: tables.households.name,
      userId: tables.households.userId,
      createdAt: tables.households.createdAt,
    })
    .from(tables.households)
    .where(eq(tables.households.id, householdId))
    .limit(1);

  if (!household) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "Household not found or access denied",
    });
  }

  if (household.userId !== session.user.id) {
    throw createError({
      statusCode: 404, // Return 404 instead of 403 to avoid leaking existence
      statusMessage: "Not Found",
      message: "Household not found or access denied",
    });
  }

  return household;
}

// ============================================================================
// Legacy/Deprecated Functions (kept for backward compatibility)
// ============================================================================

/**
 * @deprecated Use verifyPersonAccessOrThrow instead. This function returns null
 * instead of throwing errors, which makes error handling less consistent.
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
  verifyPersonAccessOrThrow,
  verifyHouseholdAccessOrThrow,
  getUserPersons,
};

import { like, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { users, households, persons } from "../../../database/schema";
import { db } from "../../../server/utils/drizzle";
import { auth } from "../../../lib/auth";

export interface TestUser {
  id: string;
  name: string;
  email: string;
  sessionCookie: string;
  householdId: number;
}

/**
 * Create a test user with authentication using Better Auth API endpoints
 */
export async function createTestUser(name: string): Promise<TestUser> {
  // Generate unique email and password
  const timestamp = Date.now();
  const randomId = randomBytes(8).toString("hex");
  const email = `test-${name.toLowerCase()}-${timestamp}@example.com`;
  const password = `testpass_${randomId}`;

  try {
    const { headers, response: signUpResponse } = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        callbackURL: "/dashboard",
      },
      returnHeaders: true,
    });

    if (!signUpResponse || !signUpResponse.user) {
      throw new Error("Failed to create user with Better Auth API");
    }

    const sessionCookie = headers
      .get("set-cookie")
      ?.split("; ")?.[0]
      ?.split("=")?.[1];

    if (!sessionCookie) {
      throw new Error("No session cookie returned after sign-up");
    }

    // Get the household that was created by the auth hook
    const userHouseholds = await db
      .select()
      .from(households)
      .where(eq(households.userId, signUpResponse.user.id))
      .limit(1);

    if (userHouseholds.length === 0) {
      throw new Error("No household found for test user");
    }

    return {
      id: signUpResponse.user.id,
      name: signUpResponse.user.name,
      email: signUpResponse.user.email,
      householdId: userHouseholds[0].id,
      sessionCookie: sessionCookie,
    };
  } catch (error) {
    console.error("Failed to create test user:", error);
    throw error;
  }
}

/**
 * Create a test person in a specific household
 */
export async function createTestPerson(
  householdId: number,
  name: string,
  age: number = 25
) {
  const [person] = await db
    .insert(persons)
    .values({
      name,
      age,
      householdId,
    })
    .returning();

  return person;
}

/**
 * Clean up all test data (users, sessions, households, persons)
 */
export async function cleanupTestData() {
  try {
    // Delete all test users (this will cascade to sessions, households, and persons)
    await db.delete(users).where(like(users.email, "test-%@example.com"));
  } catch (error) {
    console.warn("Failed to cleanup test data:", error);
  }
}

/**
 * Setup test data for integration tests
 */
export async function setupTestUsers() {
  // Create two test users for cross-user testing
  const user1 = await createTestUser("TestUser1");
  const user2 = await createTestUser("TestUser2");

  // Create some test persons for each user
  await createTestPerson(user1.householdId, "John User1", 30);
  await createTestPerson(user1.householdId, "Jane User1", 28);
  await createTestPerson(user2.householdId, "Bob User2", 35);
  await createTestPerson(user2.householdId, "Alice User2", 32);

  return { user1, user2 };
}

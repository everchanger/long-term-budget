import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "../../utils/test-data";

interface Person {
  id: number;
  name: string;
  age: number | null;
  householdId: number;
  createdAt: string | Date;
}

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/persons integration tests", async () => {
  await setup({
    // Can add any specific test config here
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: Person[] };
    user2: TestUser & { persons: Person[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with basic persons
    const user1 = await TestDataBuilder.createUser("TestUser1")
      .then((b) => b.addPerson("John User1", 30))
      .then((b) => b.addPerson("Jane User1", 28));

    const user2 = await TestDataBuilder.createUser("TestUser2")
      .then((b) => b.addPerson("Bob User2", 35))
      .then((b) => b.addPerson("Alice User2", 32));

    testUsers = {
      user1: user1.build(),
      user2: user2.build(),
    };
  });

  describe("GET /api/persons", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/persons");
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should only return persons from authenticated user household", async () => {
      // Make request as user1 using session cookie
      const user1Persons = await authenticatedFetch<Person[]>(
        testUsers.user1,
        "/api/persons"
      );

      // Should only get user1's persons, not user2's
      expect(user1Persons).toHaveLength(2);
      expect(
        user1Persons.every(
          (person) => person.householdId === testUsers.user1.householdId
        )
      ).toBe(true);

      // Verify specific persons are returned
      const personNames = user1Persons.map((p) => p.name);
      expect(personNames).toContain("John User1");
      expect(personNames).toContain("Jane User1");

      // Verify user2's persons are NOT returned
      expect(personNames).not.toContain("Bob User2");
      expect(personNames).not.toContain("Alice User2");
    });

    it("should return different persons for different users", async () => {
      // Get persons for user1
      const user1Persons = await authenticatedFetch<Person[]>(
        testUsers.user1,
        "/api/persons"
      );

      // Get persons for user2
      const user2Persons = await authenticatedFetch<Person[]>(
        testUsers.user2,
        "/api/persons"
      );

      // Verify each user gets different data
      expect(user1Persons).toHaveLength(2);
      expect(user2Persons).toHaveLength(2);

      // Verify no overlap in returned person IDs
      const user1PersonIds = user1Persons.map((p) => p.id);
      const user2PersonIds = user2Persons.map((p) => p.id);

      expect(user1PersonIds).not.toEqual(user2PersonIds);
      expect(user1PersonIds.some((id) => user2PersonIds.includes(id))).toBe(
        false
      );
    });

    it("should return empty array when user has no persons", async () => {
      // Create a user with no persons (just the basic user)
      const emptyUser = await TestDataBuilder.createUser("EmptyUser").then(
        (b) => b.getUser()
      );

      // Make request as this user
      const persons = await authenticatedFetch<Person[]>(
        emptyUser,
        "/api/persons"
      );

      // Should get empty array
      expect(persons).toEqual([]);
      expect(persons).toHaveLength(0);
    });
  });

  describe("POST /api/persons", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/persons", {
          method: "POST",
          body: {
            name: "Test Person",
            age: 25,
            household_id: "household-1",
          },
        });
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should prevent creating person in another users household", async () => {
      // Try to create person in user2's household while authenticated as user1
      try {
        await authenticatedFetch(testUsers.user1, "/api/persons", {
          method: "POST",
          body: {
            name: "Malicious Person",
            age: 25,
            household_id: testUsers.user2.householdId, // user2's household!
          },
        });
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain(
          "Household not found or access denied"
        );
      }
    });

    it("should allow creating person in own household", async () => {
      // Create person in user1's household
      const response = await authenticatedFetch<Person>(
        testUsers.user1,
        "/api/persons",
        {
          method: "POST",
          body: {
            name: "New Person",
            age: 30,
            household_id: testUsers.user1.householdId,
          },
        }
      );

      expect(response).toMatchObject({
        name: "New Person",
        age: 30,
        householdId: testUsers.user1.householdId,
      });
      expect(response.id).toBeDefined();
      expect(response.createdAt).toBeDefined();
    });
  });
});

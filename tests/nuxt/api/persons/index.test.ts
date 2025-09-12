import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  setupTestUsers,
  cleanupTestData,
  type TestUser,
} from "../../utils/test-data";

interface Person {
  id: number;
  name: string;
  age: number;
  householdId: number;
  createdAt: string;
}

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/persons integration tests", async () => {
  await setup({
    // Can add any specific test config here
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 3000}`,
  });

  let testUsers: { user1: TestUser; user2: TestUser };

  beforeAll(async () => {
    // Set up test data before running tests
    console.log("Setting up test users...");
    testUsers = await setupTestUsers();
    console.log("Test users created:", {
      user1: {
        id: testUsers.user1.id,
        email: testUsers.user1.email,
        token: testUsers.user1.token,
        householdId: testUsers.user1.householdId,
      },
      user2: {
        id: testUsers.user2.id,
        email: testUsers.user2.email,
        token: testUsers.user2.token,
        householdId: testUsers.user2.householdId,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData();
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

    it.only("should only return persons from authenticated user household", async () => {
      // Make request as user1 using session cookie

      const user1Persons = (await fetch("http://localhost:5000/api/persons", {
        headers: {
          "cache-control": "no-cache",
          cookie: `better-auth.session_token=${testUsers.user1.token}`,
        },
      })) as unknown as Person[];
      // const user1Persons = await $fetch<Person[]>(
      //   "http://localhost:5000/api/persons",
      //   {
      //     headers: {
      //       "cache-control": "no-cache",
      //       cookie: `session_token=${testUsers.user1.token}`,
      //     },
      //   }
      // );

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
      const user1Persons = await $fetch<Person[]>("/api/persons", {
        headers: {
          Cookie: `session_token=${testUsers.user1.token}`,
        },
      });

      // Get persons for user2
      const user2Persons = await $fetch<Person[]>("/api/persons", {
        headers: {
          Cookie: `session_token=${testUsers.user2.token}`,
        },
      }); // Verify each user gets different data
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
      // TODO: Create a user with no persons
      // const emptyUserPersons = await $fetch('/api/persons', {
      //   headers: {
      //     Authorization: `Bearer empty-user-token`
      //   }
      // })
      // expect(emptyUserPersons).toEqual([])
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
        await $fetch("/api/persons", {
          method: "POST",
          headers: {
            Cookie: `session_token=${testUsers.user1.token}`,
          },
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
      const newPerson = await $fetch<Person>("/api/persons", {
        method: "POST",
        headers: {
          Cookie: `session_token=${testUsers.user1.token}`,
        },
        body: {
          name: "New Person",
          age: 30,
          household_id: testUsers.user1.householdId,
        },
      });

      expect(newPerson).toMatchObject({
        name: "New Person",
        age: 30,
        householdId: testUsers.user1.householdId,
      });
      expect(newPerson.id).toBeDefined();
      expect(newPerson.createdAt).toBeDefined();
    });
  });
});

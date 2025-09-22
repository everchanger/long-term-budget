import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
  type TestPerson,
} from "../../utils/test-data";

// Use proper Drizzle-inferred person type
type Person = TestPerson;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/persons/[id] integration tests", async () => {
  await setup({
    // Can add any specific test config here
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });
  let testUsers: {
    user1: TestUser & { persons: Person[] };
    user2: TestUser & { persons: Person[] };
  };

  beforeAll(async () => {
    // Set up test data - create two users with persons
    const user1 = await TestDataBuilder.createUser("TestUser1")
      .then((b) => b.addPerson("John User1", 30))
      .then((b) => b.addPerson("Jane User1", 28));

    const user2 = await TestDataBuilder.createUser("TestUser2").then((b) =>
      b.addPerson("Bob User2", 35)
    );

    testUsers = {
      user1: user1.build(),
      user2: user2.build(),
    };
  });

  describe("GET /api/persons/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const personId = testUsers.user1.persons[0].id;

      try {
        await $fetch(`/api/persons/${personId}`);
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should return person when user owns it", async () => {
      const personId = testUsers.user1.persons[0].id;

      const person = await authenticatedFetch<Person>(
        testUsers.user1,
        `/api/persons/${personId}`
      );

      expect(person).toMatchObject({
        id: personId,
        name: "John User1",
        age: 30,
        householdId: testUsers.user1.householdId,
      });
      expect(person.createdAt).toBeDefined();
    });

    it("should return 404 when person belongs to another user", async () => {
      const user2PersonId = testUsers.user2.persons[0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/persons/${user2PersonId}`
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain(
          "Person not found or access denied"
        );
      }
    });

    it("should return 404 when person does not exist", async () => {
      const nonExistentId = 999;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/persons/${nonExistentId}`
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain(
          "Person not found or access denied"
        );
      }
    });

    it("should return 400 for invalid person ID", async () => {
      try {
        await authenticatedFetch(testUsers.user1, `/api/persons/invalid`);
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Invalid person ID");
      }
    });
  });

  describe("PUT /api/persons/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const personId = testUsers.user1.persons[0].id;

      try {
        await $fetch(`/api/persons/${personId}`, {
          method: "PUT",
          body: { name: "Updated Name", age: 35 },
        });
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should update person when user owns it", async () => {
      const personId = testUsers.user1.persons[1].id; // Use Jane User1

      const updatedPerson = await authenticatedFetch<Person>(
        testUsers.user1,
        `/api/persons/${personId}`,
        {
          method: "PUT",
          body: { name: "Jane Updated", age: 29 },
        }
      );

      expect(updatedPerson).toMatchObject({
        id: personId,
        name: "Jane Updated",
        age: 29,
        householdId: testUsers.user1.householdId,
      });
    });

    it("should update person with null age", async () => {
      const personId = testUsers.user1.persons[0].id;

      const updatedPerson = await authenticatedFetch<Person>(
        testUsers.user1,
        `/api/persons/${personId}`,
        {
          method: "PUT",
          body: { name: "John No Age" }, // No age provided
        }
      );

      expect(updatedPerson).toMatchObject({
        id: personId,
        name: "John No Age",
        age: null,
      });
    });

    it("should return 400 when name is missing", async () => {
      const personId = testUsers.user1.persons[0].id;

      try {
        await authenticatedFetch(testUsers.user1, `/api/persons/${personId}`, {
          method: "PUT",
          body: { age: 35 }, // Missing name
        });
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Name is required");
      }
    });

    it("should return 404 when trying to update another user's person", async () => {
      const user2PersonId = testUsers.user2.persons[0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/persons/${user2PersonId}`,
          {
            method: "PUT",
            body: { name: "Hacked Name", age: 25 },
          }
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain(
          "Person not found or access denied"
        );
      }
    });
  });

  describe("DELETE /api/persons/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const personId = testUsers.user1.persons[0].id;

      try {
        await $fetch(`/api/persons/${personId}`, {
          method: "DELETE",
        });
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should return 404 when trying to delete another user's person", async () => {
      const user2PersonId = testUsers.user2.persons[0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/persons/${user2PersonId}`,
          { method: "DELETE" }
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain(
          "Person not found or access denied"
        );
      }
    });

    it("should delete person when user owns it", async () => {
      // Create a person specifically for deletion
      const userWithPersonToDelete = await TestDataBuilder.createUser(
        "DeleteTestUser"
      )
        .then((b) => b.addPerson("Person To Delete", 25))
        .then((b) => b.build());

      const personId = userWithPersonToDelete.persons[0].id;

      const result = await authenticatedFetch(
        userWithPersonToDelete,
        `/api/persons/${personId}`,
        { method: "DELETE" }
      );

      expect(result).toEqual({
        message: "Person deleted successfully",
      });

      // Verify person is actually deleted by trying to fetch it
      try {
        await authenticatedFetch(
          userWithPersonToDelete,
          `/api/persons/${personId}`
        );
        expect.fail("Person should have been deleted");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return 404 when person does not exist", async () => {
      // Create a fresh user for this test to avoid session issues
      const freshUser = await TestDataBuilder.createUser(
        "FreshDeleteTestUser"
      ).then((b) => b.getUser());

      const nonExistentId = 999;

      try {
        await authenticatedFetch(freshUser, `/api/persons/${nonExistentId}`, {
          method: "DELETE",
        });
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain(
          "Person not found or access denied"
        );
      }
    });
  });
});

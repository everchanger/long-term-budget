import { describe, it, expect, beforeEach } from "vitest";

describe("Authorization Utils", () => {
  let db: any;
  let schema: any;
  let verifyPersonAccess: any;
  let getUserPersons: any;

  beforeEach(async () => {
    // Async imports to ensure environment is loaded first
    const dbModule = await import("../../db");
    const schemaModule = await import("../../db/schema");
    const authModule = await import("../../server/utils/authorization");

    db = dbModule.db;
    schema = schemaModule;
    verifyPersonAccess = authModule.verifyPersonAccess;
    getUserPersons = authModule.getUserPersons;

    // Clean up existing data before each test
    await db.delete(schema.persons);
    await db.delete(schema.households);
    await db.delete(schema.users);
  });

  describe("verifyPersonAccess", () => {
    it("should return person data when user owns the household", async () => {
      // Create test user
      const testUser = await db
        .insert(schema.users)
        .values({
          id: "1",
          name: "John Doe",
          email: "john@example.com",
        })
        .returning();

      // Create test household owned by user
      await db
        .insert(schema.households)
        .values({
          id: 1,
          name: "Test Household",
          userId: "1",
        })
        .returning();

      // Create test person in the household
      const testPerson = await db
        .insert(schema.persons)
        .values({
          id: 1,
          name: "John Person",
          age: 30,
          householdId: 1,
        })
        .returning();

      // Test authorization
      const result = await verifyPersonAccess(testPerson[0].id, testUser[0].id);

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        id: testPerson[0].id,
        name: "John Person",
      });
    });

    it("should return null when user does not own the household", async () => {
      // Create two users
      await db
        .insert(schema.users)
        .values({
          id: "1",
          name: "User One",
          email: "user1@example.com",
        })
        .returning();

      const user2 = await db
        .insert(schema.users)
        .values({
          id: "2",
          name: "User Two",
          email: "user2@example.com",
        })
        .returning();

      // Create household owned by user1
      await db
        .insert(schema.households)
        .values({
          id: 1,
          name: "User 1 Household",
          userId: "1",
        })
        .returning();

      // Create person in user1's household
      const person1 = await db
        .insert(schema.persons)
        .values({
          id: 1,
          name: "Person One",
          age: 30,
          householdId: 1,
        })
        .returning();

      // Test that user2 cannot access person1 (who belongs to user1's household)
      const result = await verifyPersonAccess(person1[0].id, user2[0].id);

      expect(result).toBeNull();
    });
  });

  describe("getUserPersons", () => {
    it("should return all persons in user households", async () => {
      // Create test user
      const testUser = await db
        .insert(schema.users)
        .values({
          id: "1",
          name: "John Doe",
          email: "john@example.com",
        })
        .returning();

      // Create test household
      await db
        .insert(schema.households)
        .values({
          id: 1,
          name: "Test Household",
          userId: "1",
        })
        .returning();

      // Create multiple persons in the household
      await db
        .insert(schema.persons)
        .values({
          id: 1,
          name: "Person One",
          age: 30,
          householdId: 1,
        })
        .returning();

      await db
        .insert(schema.persons)
        .values({
          id: 2,
          name: "Person Two",
          age: 25,
          householdId: 1,
        })
        .returning();

      // Test getting all user persons
      const result = await getUserPersons(testUser[0].id);

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Person One" }),
          expect.objectContaining({ name: "Person Two" }),
        ])
      );
    });
  });
});

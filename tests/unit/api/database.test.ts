import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { testDb } from "../../db/test-db";
import * as schema from "../../db/schema";

describe("Database Operations", () => {
  beforeEach(async () => {
    // Clean up existing data before each test
    await testDb.delete(schema.persons);
    await testDb.delete(schema.households);
    await testDb.delete(schema.users);
  });

  describe("Basic CRUD Operations", () => {
    it("should create and read a user", async () => {
      const newUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      };

      await testDb.insert(schema.users).values(newUser);
      const users = await testDb.select().from(schema.users);

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      });
    });

    it("should create household with user relationship", async () => {
      // Create user first
      await testDb.insert(schema.users).values({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      });

      // Create household
      await testDb.insert(schema.households).values({
        id: 1,
        name: "Test Household",
        userId: "1",
      });

      // Verify relationship
      const householdsWithUsers = await testDb
        .select()
        .from(schema.households)
        .innerJoin(schema.users, eq(schema.households.userId, schema.users.id));

      expect(householdsWithUsers).toHaveLength(1);
      expect(householdsWithUsers[0].households.name).toBe("Test Household");
      expect(householdsWithUsers[0].users.name).toBe("John Doe");
    });
  });
});

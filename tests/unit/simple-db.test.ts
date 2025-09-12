import { describe, it, expect } from "vitest";
import { db } from "@s/utils/drizzle";

describe("Database Test", () => {
  it("should connect to database", () => {
    expect(db).toBeDefined();
  });

  it("should be connected to test database", async () => {
    // This will verify we're actually connected to the test database
    const result = await db.execute("SELECT current_database()");
    expect(result.rows[0].current_database).toBe("budgetdb_test");
  });
});

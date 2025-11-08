import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { loans } from "../../../../database/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
  type TestPerson,
} from "../../utils/test-data";

// Use Drizzle-inferred loan type
type Loan = InferSelectModel<typeof loans>;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/loans integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with persons and loans
    const user1 = await TestDataBuilder.createUser("LoanTestUser1")
      .then((b) => b.addPerson("John Loan1", 30))
      .then((b) =>
        b.addLoan({
          name: "Car Loan John",
          originalAmount: "25000",
          currentBalance: "20000",
          interestRate: "5",
          monthlyPayment: "450",
          loanType: "car",
        })
      )
      .then((b) => b.addPerson("Jane Loan1", 28))
      .then((b) =>
        b.addLoan({
          name: "Personal Loan Jane",
          originalAmount: "10000",
          currentBalance: "8000",
          interestRate: "8",
          monthlyPayment: "200",
          loanType: "personal",
        })
      );

    const user2 = await TestDataBuilder.createUser("LoanTestUser2")
      .then((b) => b.addPerson("Bob Loan2", 35))
      .then((b) =>
        b.addLoan({
          name: "Mortgage Bob",
          originalAmount: "300000",
          currentBalance: "280000",
          interestRate: "3.5",
          monthlyPayment: "1800",
          loanType: "mortgage",
        })
      );

    testUsers = {
      user1: await user1.build(),
      user2: await user2.build(),
    };
  });

  describe("GET /api/loans", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/loans?personId=1");
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 400 when personId is missing", async () => {
      try {
        await authenticatedFetch<Loan[]>(testUsers.user1, "/api/loans");
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("personId is required");
      }
    });

    it("should return 403 when requesting loans for another user's person", async () => {
      const otherUserPersonId = testUsers.user2.persons[0].id;

      try {
        await authenticatedFetch<Loan[]>(
          testUsers.user1,
          `/api/loans?personId=${otherUserPersonId}`
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should return empty array when person has no loans", async () => {
      // Create a person with no loans
      const userWithoutLoans = await TestDataBuilder.createUser("NoLoansUser")
        .then((b) => b.addPerson("No Loans Person", 25))
        .then((b) => b.build());

      const loans = await authenticatedFetch<Loan[]>(
        userWithoutLoans,
        `/api/loans?personId=${userWithoutLoans.persons[0].id}`
      );

      expect(loans).toEqual([]);
    });

    it("should return loans for own person", async () => {
      const loans = await authenticatedFetch<Loan[]>(
        testUsers.user1,
        `/api/loans?personId=${testUsers.user1.persons[0].id}`
      );

      expect(loans).toHaveLength(1);
      expect(loans[0]).toMatchObject({
        name: "Car Loan John",
        originalAmount: "25000.00",
        currentBalance: "20000.00",
        interestRate: "5",
        monthlyPayment: "450.00",
        loanType: "car",
        personId: testUsers.user1.persons[0].id,
      });
      expect(loans[0].id).toBeDefined();
      expect(loans[0].createdAt).toBeDefined();
    });
  });

  describe("POST /api/loans", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/loans", {
          method: "POST",
          body: {
            name: "Test Loan",
            originalAmount: "5000",
            currentBalance: "4000",
            interestRate: "6",
            monthlyPayment: "100",
            personId: testUsers.user1.persons[0].id,
          },
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 400 when required fields are missing", async () => {
      try {
        await authenticatedFetch<Loan>(testUsers.user1, "/api/loans", {
          method: "POST",
          body: {
            name: "Incomplete Loan",
            // Missing required fields
          },
        });
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Missing required fields");
      }
    });

    it("should return 403 when trying to create loan for another user's person", async () => {
      try {
        await authenticatedFetch<Loan>(testUsers.user1, "/api/loans", {
          method: "POST",
          body: {
            name: "Unauthorized Loan",
            originalAmount: "5000",
            currentBalance: "4000",
            interestRate: "6",
            monthlyPayment: "100",
            personId: testUsers.user2.persons[0].id, // Another user's person
          },
        });
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should allow creating loan for own person", async () => {
      const newLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        "/api/loans",
        {
          method: "POST",
          body: {
            name: "New Student Loan",
            originalAmount: "15000",
            currentBalance: "12000",
            interestRate: "4.5",
            monthlyPayment: "300",
            loanType: "student",
            personId: testUsers.user1.persons[1].id,
          },
        }
      );

      expect(newLoan).toMatchObject({
        name: "New Student Loan",
        originalAmount: "15000.00",
        currentBalance: "12000.00",
        interestRate: "4.5",
        monthlyPayment: "300.00",
        loanType: "student",
        personId: testUsers.user1.persons[1].id,
      });
      expect(newLoan.id).toBeDefined();
      expect(newLoan.createdAt).toBeDefined();
    });

    it("should create loan with minimal required fields", async () => {
      const minimalLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        "/api/loans",
        {
          method: "POST",
          body: {
            name: "Minimal Loan",
            originalAmount: "5000",
            currentBalance: "4500",
            interestRate: "6",
            monthlyPayment: "150",
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      expect(minimalLoan).toMatchObject({
        name: "Minimal Loan",
        originalAmount: "5000.00",
        currentBalance: "4500.00",
        interestRate: "6",
        monthlyPayment: "150.00",
        personId: testUsers.user1.persons[0].id,
      });
      expect(minimalLoan.loanType).toBeNull();
      expect(minimalLoan.endDate).toBeNull();
    });
  });
});

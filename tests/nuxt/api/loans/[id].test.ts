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

describe("/api/loans/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with persons and loans
    const user1 = await TestDataBuilder.createUser("LoanIdTestUser1")
      .then((b) => b.addPerson("John LoanId1", 30))
      .then((b) =>
        b.addLoan({
          name: "Car Loan John",
          originalAmount: 25000,
          currentBalance: 20000,
          interestRate: 0.05,
          monthlyPayment: 450,
          loanType: "car",
        })
      )
      .then((b) => b.addPerson("Jane LoanId1", 28))
      .then((b) =>
        b.addLoan({
          name: "Personal Loan Jane",
          originalAmount: 10000,
          currentBalance: 8000,
          interestRate: 0.08,
          monthlyPayment: 200,
          loanType: "personal",
        })
      );

    const user2 = await TestDataBuilder.createUser("LoanIdTestUser2")
      .then((b) => b.addPerson("Bob LoanId2", 35))
      .then((b) =>
        b.addLoan({
          name: "Mortgage Bob",
          originalAmount: 300000,
          currentBalance: 280000,
          interestRate: 0.035,
          monthlyPayment: 1800,
          loanType: "mortgage",
        })
      );

    testUsers = {
      user1: await user1.build(),
      user2: await user2.build(),
    };
  });

  describe("GET /api/loans/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const loan = testUsers.user1.persons[0].loans![0];

      try {
        await $fetch(`/api/loans/${loan.id}`);
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return loan when user owns the person", async () => {
      const loan = testUsers.user1.persons[0].loans![0];

      const fetchedLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        `/api/loans/${loan.id}`
      );

      expect(fetchedLoan).toMatchObject({
        id: loan.id,
        name: "Car Loan John",
        originalAmount: "25000.00",
        currentBalance: "20000.00",
        interestRate: "0.0500",
        monthlyPayment: "450.00",
        loanType: "car",
        personId: testUsers.user1.persons[0].id,
      });
    });

    it("should return 403 when loan belongs to another user's person", async () => {
      const otherUserLoan = testUsers.user2.persons[0].loans![0];

      try {
        await authenticatedFetch<Loan>(
          testUsers.user1,
          `/api/loans/${otherUserLoan.id}`
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

    it("should return 404 when loan does not exist", async () => {
      try {
        await authenticatedFetch<Loan>(testUsers.user1, "/api/loans/99999");
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Loan not found");
      }
    });

    it("should return 400 for invalid loan ID", async () => {
      try {
        await authenticatedFetch<Loan>(testUsers.user1, "/api/loans/invalid");
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Loan ID is required");
      }
    });
  });

  describe("PUT /api/loans/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const loan = testUsers.user1.persons[0].loans![0];

      try {
        await $fetch(`/api/loans/${loan.id}`, {
          method: "PUT",
          body: {
            name: "Updated Loan",
            originalAmount: 30000,
            currentBalance: 25000,
            interestRate: 0.045,
            monthlyPayment: 500,
          },
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should update loan when user owns it", async () => {
      const loan = testUsers.user1.persons[1].loans![0];

      const updatedLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        `/api/loans/${loan.id}`,
        {
          method: "PUT",
          body: {
            name: "Updated Personal Loan",
            originalAmount: 12000,
            currentBalance: 9000,
            interestRate: 0.075,
            monthlyPayment: 250,
            loanType: "personal",
          },
        }
      );

      expect(updatedLoan).toMatchObject({
        id: loan.id,
        name: "Updated Personal Loan",
        originalAmount: "12000.00",
        currentBalance: "9000.00",
        interestRate: "0.0750",
        monthlyPayment: "250.00",
        loanType: "personal",
        personId: testUsers.user1.persons[1].id,
      });
    });

    it("should return 403 when trying to update another user's loan", async () => {
      const otherUserLoan = testUsers.user2.persons[0].loans![0];

      try {
        await authenticatedFetch<Loan>(
          testUsers.user1,
          `/api/loans/${otherUserLoan.id}`,
          {
            method: "PUT",
            body: {
              name: "Unauthorized Update",
              originalAmount: 50000,
              currentBalance: 45000,
              interestRate: 0.04,
              monthlyPayment: 800,
            },
          }
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

    it("should return 404 when trying to update non-existent loan", async () => {
      try {
        await authenticatedFetch<Loan>(testUsers.user1, "/api/loans/99999", {
          method: "PUT",
          body: {
            name: "Non-existent Loan",
            originalAmount: 5000,
            currentBalance: 4000,
            interestRate: 0.06,
            monthlyPayment: 100,
          },
        });
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Loan not found");
      }
    });

    it("should return 400 when required fields are missing", async () => {
      const loan = testUsers.user1.persons[0].loans![0];

      try {
        await authenticatedFetch<Loan>(
          testUsers.user1,
          `/api/loans/${loan.id}`,
          {
            method: "PUT",
            body: {
              name: "Incomplete Update",
              // Missing required fields
            },
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Missing required fields");
      }
    });

    it("should update loan with minimal required fields", async () => {
      // Create a new loan for this test
      const newLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        "/api/loans",
        {
          method: "POST",
          body: {
            name: "Test Update Loan",
            originalAmount: 8000,
            currentBalance: 7000,
            interestRate: 0.055,
            monthlyPayment: 180,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      const updatedLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        `/api/loans/${newLoan.id}`,
        {
          method: "PUT",
          body: {
            name: "Minimal Update",
            originalAmount: 9000,
            currentBalance: 8500,
            interestRate: 0.06,
            monthlyPayment: 200,
          },
        }
      );

      expect(updatedLoan).toMatchObject({
        id: newLoan.id,
        name: "Minimal Update",
        originalAmount: "9000.00",
        currentBalance: "8500.00",
        interestRate: "0.0600",
        monthlyPayment: "200.00",
        personId: testUsers.user1.persons[0].id,
      });
    });
  });

  describe("DELETE /api/loans/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const loan = testUsers.user1.persons[0].loans![0];

      try {
        await $fetch(`/api/loans/${loan.id}`, {
          method: "DELETE",
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should delete loan when user owns it", async () => {
      // Create a new loan for this test to avoid affecting other tests
      const newLoan = await authenticatedFetch<Loan>(
        testUsers.user1,
        "/api/loans",
        {
          method: "POST",
          body: {
            name: "Test Delete Loan",
            originalAmount: 6000,
            currentBalance: 5000,
            interestRate: 0.07,
            monthlyPayment: 150,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      const deleteResponse = await authenticatedFetch<{
        success: boolean;
        message: string;
      }>(testUsers.user1, `/api/loans/${newLoan.id}`, {
        method: "DELETE",
      });

      expect(deleteResponse).toEqual({
        success: true,
        message: "Loan deleted successfully",
      });

      // Verify the loan is actually deleted
      try {
        await authenticatedFetch<Loan>(
          testUsers.user1,
          `/api/loans/${newLoan.id}`
        );
        expect.fail("Expected request to fail with 404 after deletion");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return 403 when trying to delete another user's loan", async () => {
      const otherUserLoan = testUsers.user2.persons[0].loans![0];

      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          `/api/loans/${otherUserLoan.id}`,
          {
            method: "DELETE",
          }
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

    it("should return 404 when trying to delete non-existent loan", async () => {
      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          "/api/loans/99999",
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Loan not found");
      }
    });

    it("should return 400 for invalid loan ID", async () => {
      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          "/api/loans/invalid",
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Loan ID is required");
      }
    });
  });
});

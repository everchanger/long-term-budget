import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { TestDataBuilder, authenticatedFetch } from "../../utils/test-data";

interface BrokerAccountResponse {
  id: number;
  name: string;
  brokerName: string | null;
  accountType: string | null;
  currentValue: string;
  personId: number;
  createdAt: string;
}

describe("/api/broker-accounts integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  describe("GET /api/broker-accounts", () => {
    it("should get all broker accounts for authenticated user's household", async () => {
      // Create user with persons and broker accounts
      const user1 = await TestDataBuilder.createUser("BrokerTestUser1")
        .then((builder) => builder.addPerson("John", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Investment Account",
            brokerName: "Fidelity",
            accountType: "investment",
            currentValue: 75000,
          })
        )
        .then((builder) => builder.addPerson("Jane", 28))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Retirement 401k",
            brokerName: "Vanguard",
            accountType: "retirement",
            currentValue: 120000,
          })
        );

      // Create separate user to ensure isolation
      const user2 = await TestDataBuilder.createUser("BrokerTestUser2")
        .then((builder) => builder.addPerson("Alice", 35))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Trading Account",
            brokerName: "TD Ameritrade",
            accountType: "trading",
            currentValue: 25000,
          })
        );

      // Get broker accounts for user1
      const response = (await authenticatedFetch(
        user1.getUser(),
        "/api/broker-accounts"
      )) as BrokerAccountResponse[];

      expect(response).toHaveLength(2);
      expect(response[0]).toMatchObject({
        name: "Investment Account",
        brokerName: "Fidelity",
        accountType: "investment",
        currentValue: "75000.00",
        personId: expect.any(Number),
      });
      expect(response[1]).toMatchObject({
        name: "Retirement 401k",
        brokerName: "Vanguard",
        accountType: "retirement",
        currentValue: "120000.00",
        personId: expect.any(Number),
      });

      // Verify user1 can't see user2's broker accounts
      const user2Response = (await authenticatedFetch(
        user2.getUser(),
        "/api/broker-accounts"
      )) as BrokerAccountResponse[];
      expect(user2Response).toHaveLength(1);
      expect(user2Response[0]).toMatchObject({
        name: "Trading Account",
        brokerName: "TD Ameritrade",
        accountType: "trading",
        currentValue: "25000.00",
      });

      // Verify response doesn't contain user1's data
      expect(
        user2Response.some(
          (account: BrokerAccountResponse) =>
            account.name === "Investment Account"
        )
      ).toBe(false);
      expect(
        user2Response.some(
          (account: BrokerAccountResponse) => account.name === "Retirement 401k"
        )
      ).toBe(false);
    });

    it("should filter broker accounts by personId when provided", async () => {
      const userData = await TestDataBuilder.createUser("FilteredBrokerUser")
        .then((builder) => builder.addPerson("PersonA", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "PersonA Investment",
            currentValue: 40000,
          })
        )
        .then((builder) => builder.addPerson("PersonB", 32))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "PersonB Trading",
            currentValue: 15000,
          })
        )
        .then((builder) => builder.build());

      const personAId = userData.persons[0].id;
      const personBId = userData.persons[1].id;

      // Get broker accounts for specific person
      const responseA = (await authenticatedFetch(
        userData,
        `/api/broker-accounts?personId=${personAId}`
      )) as BrokerAccountResponse[];

      expect(responseA).toHaveLength(1);
      expect(responseA[0]).toMatchObject({
        name: "PersonA Investment",
        personId: personAId,
        currentValue: "40000.00",
      });

      const responseB = (await authenticatedFetch(
        userData,
        `/api/broker-accounts?personId=${personBId}`
      )) as BrokerAccountResponse[];

      expect(responseB).toHaveLength(1);
      expect(responseB[0]).toMatchObject({
        name: "PersonB Trading",
        personId: personBId,
        currentValue: "15000.00",
      });
    });

    it("should return empty array for user with no broker accounts", async () => {
      const userWithoutBrokerAccounts = await TestDataBuilder.createUser(
        "NoBrokerUser"
      )
        .then((builder) => builder.addPerson("NoAccounts", 25))
        .then((builder) => builder.getUser());

      const response = await authenticatedFetch(
        userWithoutBrokerAccounts,
        "/api/broker-accounts"
      );

      expect(response).toEqual([]);
    });

    it("should return empty array for personId filter with no broker accounts", async () => {
      const userData = await TestDataBuilder.createUser("NoPersonBrokerUser")
        .then((builder) => builder.addPerson("EmptyPerson", 30))
        .then((builder) => builder.build());

      const response = await authenticatedFetch(
        userData,
        `/api/broker-accounts?personId=${userData.persons[0].id}`
      );

      expect(response).toEqual([]);
    });

    it("should require authentication", async () => {
      const response = await $fetch("/api/broker-accounts", {
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "You must be logged in to access broker accounts",
      });
    });

    it("should reject access to another user's persons", async () => {
      const user1 = await TestDataBuilder.createUser("User1BrokerFilter")
        .then((builder) => builder.addPerson("User1Person", 30))
        .then((builder) => builder.build());

      const user2 = await TestDataBuilder.createUser("User2BrokerFilter")
        .then((builder) => builder.addPerson("User2Person", 25))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "User2 Account",
            currentValue: 30000,
          })
        )
        .then((builder) => builder.build());

      // User1 tries to access User2's person's broker accounts
      const response = await authenticatedFetch(
        user1,
        `/api/broker-accounts?personId=${user2.persons[0].id}`
      );

      // Should return empty array (no access to other user's data)
      expect(response).toEqual([]);
    });
  });

  describe("POST /api/broker-accounts", () => {
    it("should create a new broker account for authenticated user's person", async () => {
      const userData = await TestDataBuilder.createUser("CreateBrokerUser")
        .then((builder) => builder.addPerson("TestPerson", 30))
        .then((builder) => builder.build());

      const newAccount = {
        name: "New Investment Account",
        brokerName: "Charles Schwab",
        accountType: "investment",
        currentValue: 85000,
        personId: userData.persons[0].id,
      };

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "POST",
          body: newAccount,
        }
      );

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: "New Investment Account",
        brokerName: "Charles Schwab",
        accountType: "investment",
        currentValue: "85000.00",
        personId: userData.persons[0].id,
        createdAt: expect.any(String),
      });
    });

    it("should create broker account with minimal required fields", async () => {
      const userData = await TestDataBuilder.createUser("MinimalBrokerUser")
        .then((builder) => builder.addPerson("MinimalPerson", 25))
        .then((builder) => builder.build());

      const minimalAccount = {
        name: "Simple Account",
        currentValue: 10000,
        personId: userData.persons[0].id,
      };

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "POST",
          body: minimalAccount,
        }
      );

      expect(response).toMatchObject({
        id: expect.any(Number),
        name: "Simple Account",
        brokerName: null,
        accountType: null,
        currentValue: "10000.00",
        personId: userData.persons[0].id,
      });
    });

    it("should reject request with missing required fields", async () => {
      const userData = await TestDataBuilder.createUser("InvalidBrokerUser")
        .then((builder) => builder.addPerson("TestPerson", 30))
        .then((builder) => builder.build());

      // Missing name
      const missingName = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "POST",
          body: {
            currentValue: 15000,
            personId: userData.persons[0].id,
          },
          ignoreResponseError: true,
        }
      );

      expect(missingName).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message:
          "Missing required fields: name, currentValue, and personId are required",
      });

      // Missing currentValue
      const missingValue = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "POST",
          body: {
            name: "Test Account",
            personId: userData.persons[0].id,
          },
          ignoreResponseError: true,
        }
      );

      expect(missingValue).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message:
          "Missing required fields: name, currentValue, and personId are required",
      });

      // Missing personId
      const missingPersonId = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "POST",
          body: {
            name: "Test Account",
            currentValue: 15000,
          },
          ignoreResponseError: true,
        }
      );

      expect(missingPersonId).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message:
          "Missing required fields: name, currentValue, and personId are required",
      });
    });

    it("should require authentication", async () => {
      const response = await $fetch("/api/broker-accounts", {
        method: "POST",
        body: {
          name: "Test Account",
          currentValue: 10000,
          personId: 1,
        },
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "You must be logged in to access broker accounts",
      });
    });

    it("should reject creating broker account for another user's person", async () => {
      const user1 = await TestDataBuilder.createUser("User1CreateBroker")
        .then((builder) => builder.addPerson("User1Person", 30))
        .then((builder) => builder.build());

      const user2 = await TestDataBuilder.createUser("User2CreateBroker")
        .then((builder) => builder.addPerson("User2Person", 25))
        .then((builder) => builder.build());

      // User1 tries to create broker account for User2's person
      const response = await authenticatedFetch(user1, "/api/broker-accounts", {
        method: "POST",
        body: {
          name: "Unauthorized Account",
          currentValue: 20000,
          personId: user2.persons[0].id,
        },
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Access denied: Person does not belong to your household",
      });
    });
  });

  describe("Method validation", () => {
    it("should reject unsupported HTTP methods", async () => {
      const userData = await TestDataBuilder.createUser("MethodTestUser").then(
        (builder) => builder.getUser()
      );

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts",
        {
          method: "PUT",
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 405,
        statusMessage: "Method not allowed",
      });
    });
  });
});

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

describe("/api/broker-accounts/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  describe("GET /api/broker-accounts/[id]", () => {
    it("should get a specific broker account for authenticated user", async () => {
      const userData = await TestDataBuilder.createUser("BrokerIdTestUser1")
        .then((builder) => builder.addPerson("John", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Primary Investment",
            brokerName: "Fidelity",
            accountType: "investment",
            currentValue: 85000,
          })
        )
        .then((builder) => builder.addPerson("Jane", 28))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Retirement 401k",
            brokerName: "Vanguard",
            accountType: "retirement",
            currentValue: 150000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccount1Id = userData.persons[0].brokerAccounts![0].id;

      const response = (await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccount1Id}`
      )) as BrokerAccountResponse;

      expect(response).toMatchObject({
        id: brokerAccount1Id,
        name: "Primary Investment",
        brokerName: "Fidelity",
        accountType: "investment",
        currentValue: "85000.00",
        personId: userData.persons[0].id,
        createdAt: expect.any(String),
      });
    });

    it("should return 404 for non-existent broker account", async () => {
      const userData = await TestDataBuilder.createUser("NonExistentBrokerUser")
        .then((builder) => builder.addPerson("Test", 30))
        .then((builder) => builder.build());

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts/99999",
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should return 404 when trying to access another user's broker account", async () => {
      // Create two separate users
      const user1 = await TestDataBuilder.createUser("BrokerIdTestUser1")
        .then((builder) => builder.addPerson("User1Person", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "User1 Account",
            currentValue: 40000,
          })
        )
        .then((builder) => builder.build());

      const user2 = await TestDataBuilder.createUser("BrokerIdTestUser2")
        .then((builder) => builder.addPerson("User2Person", 25))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "User2 Account",
            currentValue: 60000,
          })
        )
        .then((builder) => builder.build());

      const user1BrokerAccountId = user1.persons[0].brokerAccounts![0].id;

      // User2 tries to access User1's broker account
      const response = await authenticatedFetch(
        user2,
        `/api/broker-accounts/${user1BrokerAccountId}`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should require authentication", async () => {
      const response = await $fetch("/api/broker-accounts/1", {
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    it("should return 400 for invalid broker account ID", async () => {
      const userData = await TestDataBuilder.createUser("InvalidIdUser").then(
        (builder) => builder.getUser()
      );

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts/invalid",
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Account ID is required",
      });
    });
  });

  describe("PUT /api/broker-accounts/[id]", () => {
    it("should update a broker account for authenticated user", async () => {
      const userData = await TestDataBuilder.createUser("UpdateBrokerUser")
        .then((builder) => builder.addPerson("UpdatePerson", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Original Account",
            brokerName: "Original Broker",
            accountType: "investment",
            currentValue: 50000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccountId = userData.persons[0].brokerAccounts![0].id;

      const updateData = {
        name: "Updated Investment Account",
        brokerName: "Charles Schwab",
        accountType: "retirement",
        currentValue: 75000,
      };

      const response = (await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "PUT",
          body: updateData,
        }
      )) as BrokerAccountResponse;

      expect(response).toMatchObject({
        id: brokerAccountId,
        name: "Updated Investment Account",
        brokerName: "Charles Schwab",
        accountType: "retirement",
        currentValue: "75000.00",
        personId: userData.persons[0].id,
      });
    });

    it("should update broker account with partial data", async () => {
      const userData = await TestDataBuilder.createUser("PartialUpdateUser")
        .then((builder) => builder.addPerson("PartialPerson", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Partial Account",
            brokerName: "Original Broker",
            accountType: "investment",
            currentValue: 30000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccountId = userData.persons[0].brokerAccounts![0].id;

      // Update only name and value
      const updateData = {
        name: "Updated Name Only",
        currentValue: 35000,
      };

      const response = (await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "PUT",
          body: updateData,
        }
      )) as BrokerAccountResponse;

      expect(response).toMatchObject({
        id: brokerAccountId,
        name: "Updated Name Only",
        brokerName: null, // Should be null when not provided
        accountType: null, // Should be null when not provided
        currentValue: "35000.00",
        personId: userData.persons[0].id,
      });
    });

    it("should return 400 for missing required fields", async () => {
      const userData = await TestDataBuilder.createUser("MissingFieldsUser")
        .then((builder) => builder.addPerson("MissingPerson", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Test Account",
            currentValue: 20000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccountId = userData.persons[0].brokerAccounts![0].id;

      // Missing name
      const missingName = await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "PUT",
          body: { currentValue: 25000 },
          ignoreResponseError: true,
        }
      );

      expect(missingName).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Missing required fields: name and currentValue are required",
      });

      // Missing currentValue
      const missingValue = await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "PUT",
          body: { name: "Updated Name" },
          ignoreResponseError: true,
        }
      );

      expect(missingValue).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Missing required fields: name and currentValue are required",
      });
    });

    it("should return 404 for non-existent broker account", async () => {
      const userData = await TestDataBuilder.createUser("NonExistentUpdateUser")
        .then((builder) => builder.addPerson("Test", 30))
        .then((builder) => builder.build());

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts/99999",
        {
          method: "PUT",
          body: {
            name: "Updated Name",
            currentValue: 15000,
          },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should return 404 when trying to update another user's broker account", async () => {
      const user1 = await TestDataBuilder.createUser("UpdateUser1")
        .then((builder) => builder.addPerson("User1Person", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "User1 Account",
            currentValue: 40000,
          })
        )
        .then((builder) => builder.build());

      const user2 = await TestDataBuilder.createUser("UpdateUser2")
        .then((builder) => builder.addPerson("User2Person", 25))
        .then((builder) => builder.build());

      const user1BrokerAccountId = user1.persons[0].brokerAccounts![0].id;

      // User2 tries to update User1's broker account
      const response = await authenticatedFetch(
        user2,
        `/api/broker-accounts/${user1BrokerAccountId}`,
        {
          method: "PUT",
          body: {
            name: "Unauthorized Update",
            currentValue: 99999,
          },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should require authentication", async () => {
      const response = await $fetch("/api/broker-accounts/1", {
        method: "PUT",
        body: {
          name: "Test",
          currentValue: 10000,
        },
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });
  });

  describe("DELETE /api/broker-accounts/[id]", () => {
    it("should delete a broker account for authenticated user", async () => {
      const userData = await TestDataBuilder.createUser("DeleteBrokerUser")
        .then((builder) => builder.addPerson("DeletePerson", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Account to Delete",
            currentValue: 25000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccountId = userData.persons[0].brokerAccounts![0].id;

      const response = await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        { method: "DELETE" }
      );

      expect(response).toEqual({
        success: true,
        message: "Broker account deleted successfully",
      });

      // Verify the broker account is actually deleted
      const getResponse = await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        { ignoreResponseError: true }
      );

      expect(getResponse).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should return 404 for non-existent broker account", async () => {
      const userData = await TestDataBuilder.createUser("NonExistentDeleteUser")
        .then((builder) => builder.addPerson("Test", 30))
        .then((builder) => builder.build());

      const response = await authenticatedFetch(
        userData,
        "/api/broker-accounts/99999",
        {
          method: "DELETE",
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });
    });

    it("should return 404 when trying to delete another user's broker account", async () => {
      const userWithBrokerAccount = await TestDataBuilder.createUser(
        "UserWithBrokerToDelete"
      )
        .then((builder) => builder.addPerson("PersonWithBroker", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Account to be Protected",
            currentValue: 50000,
          })
        )
        .then((builder) => builder.build());

      const unauthorizedUser = await TestDataBuilder.createUser(
        "UnauthorizedDeleteUser"
      )
        .then((builder) => builder.addPerson("UnauthorizedPerson", 25))
        .then((builder) => builder.build());

      const brokerAccountId =
        userWithBrokerAccount.persons[0].brokerAccounts![0].id;

      // Unauthorized user tries to delete the broker account
      const response = await authenticatedFetch(
        unauthorizedUser,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "DELETE",
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Broker account not found or access denied",
      });

      // Verify the broker account still exists
      const verifyResponse = await authenticatedFetch(
        userWithBrokerAccount,
        `/api/broker-accounts/${brokerAccountId}`
      );

      expect(verifyResponse).toMatchObject({
        id: brokerAccountId,
        name: "Account to be Protected",
      });
    });

    it("should require authentication", async () => {
      const response = await $fetch("/api/broker-accounts/1", {
        method: "DELETE",
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });
  });

  describe("Method validation", () => {
    it("should reject unsupported HTTP methods", async () => {
      const userData = await TestDataBuilder.createUser("MethodTestUser")
        .then((builder) => builder.addPerson("MethodPerson", 30))
        .then((builder) =>
          builder.addBrokerAccount({
            name: "Method Test Account",
            currentValue: 10000,
          })
        )
        .then((builder) => builder.build());

      const brokerAccountId = userData.persons[0].brokerAccounts![0].id;

      const response = await authenticatedFetch(
        userData,
        `/api/broker-accounts/${brokerAccountId}`,
        {
          method: "PATCH",
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

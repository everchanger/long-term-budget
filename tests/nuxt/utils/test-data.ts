import { eq, type InferSelectModel } from "drizzle-orm";
import { randomBytes } from "crypto";
import { $fetch } from "@nuxt/test-utils/e2e";
import type { users } from "../../../database/schema";
import {
  households,
  persons,
  incomeSources,
  expenses,
  savingsAccounts,
  loans,
  brokerAccounts,
  savingsGoals,
  savingsGoalAccounts,
} from "../../../database/schema";
import { db } from "../../../server/utils/drizzle";
import { auth } from "../../../lib/auth";

// Infer types from Drizzle schemas
type User = InferSelectModel<typeof users>;
type Person = InferSelectModel<typeof persons>;

// Extended test user type that includes session cookie and household reference
export interface TestUser
  extends Omit<User, "emailVerified" | "image" | "updatedAt"> {
  sessionCookie: string;
  householdId: number;
}

/**
 * Create a test user with authentication using Better Auth API endpoints
 */
export async function createTestUser(name: string): Promise<TestUser> {
  // Generate unique email and password
  const timestamp = Date.now();
  const randomId = randomBytes(8).toString("hex");
  const email = `test-${name.toLowerCase()}-${timestamp}@example.com`;
  const password = `testpass_${randomId}`;

  try {
    const { headers, response: signUpResponse } = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        callbackURL: "/dashboard",
      },
      returnHeaders: true,
    });

    if (!signUpResponse || !signUpResponse.user) {
      throw new Error("Failed to create user with Better Auth API");
    }

    // Extract session cookie from set-cookie header
    const setCookieHeader = headers.get("set-cookie");

    if (!setCookieHeader) {
      throw new Error("No set-cookie header returned after sign-up");
    }

    // Parse the session cookie (Better Auth typically uses 'better-auth.session_token')
    const sessionCookieMatch = setCookieHeader.match(
      /better-auth\.session_token=([^;]+)/
    );
    const sessionCookie = sessionCookieMatch?.[1];

    if (!sessionCookie) {
      throw new Error("No session cookie found in set-cookie header");
    }

    // Get the household that was created by the auth hook
    const userHouseholds = await db
      .select()
      .from(households)
      .where(eq(households.userId, signUpResponse.user.id))
      .limit(1);

    if (userHouseholds.length === 0) {
      throw new Error("No household found for test user");
    }

    return {
      id: signUpResponse.user.id,
      name: signUpResponse.user.name,
      email: signUpResponse.user.email,
      createdAt: signUpResponse.user.createdAt,
      householdId: userHouseholds[0].id,
      sessionCookie: sessionCookie,
    };
  } catch (error) {
    console.error("Failed to create test user:", error);
    throw error;
  }
}

/**
 * Create a test person in a specific household
 */
export async function createTestPerson(
  householdId: number,
  name: string,
  age: number = 25
) {
  const [person] = await db
    .insert(persons)
    .values({
      name,
      age,
      householdId,
    })
    .returning();

  return person;
}

// Type for person with optional financial data using Drizzle inferred types
type IncomeSource = InferSelectModel<typeof incomeSources>;
type Expense = InferSelectModel<typeof expenses>;
type SavingsAccount = InferSelectModel<typeof savingsAccounts>;
type Loan = InferSelectModel<typeof loans>;
type BrokerAccount = InferSelectModel<typeof brokerAccounts>;

export type TestPerson = Person & {
  incomeSources?: IncomeSource[];
  expenses?: Expense[];
  savingsAccounts?: SavingsAccount[];
  loans?: Loan[];
  brokerAccounts?: BrokerAccount[];
};

/**
 * Chainable test data builder for creating users and their related entities.
 * See tests/nuxt/README.md for comprehensive usage examples.
 */
export class TestDataBuilder {
  private user?: TestUser;
  private persons: TestPerson[] = [];

  /**
   * Create a new test user and start the chain
   */
  static async createUser(name: string): Promise<TestDataBuilder> {
    const builder = new TestDataBuilder();
    builder.user = await createTestUser(name);
    return builder;
  }

  /**
   * Add a person to the user's household
   */
  async addPerson(name: string, age: number = 25): Promise<TestDataBuilder> {
    if (!this.user) {
      throw new Error("Must create a user first");
    }

    const person = await createTestPerson(this.user.householdId, name, age);
    this.persons.push(person);
    return this;
  }

  /**
   * Add multiple persons to the user's household
   */
  async addPersons(
    personData: Array<{ name: string; age?: number }>
  ): Promise<TestDataBuilder> {
    for (const person of personData) {
      await this.addPerson(person.name, person.age);
    }
    return this;
  }

  /**
   * Add an income source to the last added person
   */
  async addIncomeSource(data?: {
    name?: string;
    amount?: string;
    frequency?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }): Promise<TestDataBuilder> {
    const lastPerson = this.persons[this.persons.length - 1];
    if (!lastPerson) {
      throw new Error("Must add a person before adding income source");
    }

    // Insert into database using actual schema
    const [incomeSource] = await db
      .insert(incomeSources)
      .values({
        personId: lastPerson.id,
        name: data?.name || "Test Salary",
        amount: data?.amount || "5000",
        frequency: data?.frequency || "monthly",
        startDate: data?.startDate || null,
        endDate: data?.endDate || null,
        isActive: data?.isActive ?? true,
      })
      .returning();

    // Store income source on the person for easy access
    if (!lastPerson.incomeSources) lastPerson.incomeSources = [];
    lastPerson.incomeSources.push(incomeSource);

    return this;
  }

  /**
   * Add an expense to the last added person
   */
  async addExpense(data?: {
    name?: string;
    amount?: string;
    frequency?: string;
    category?: string;
    isFixed?: boolean;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }): Promise<TestDataBuilder> {
    const lastPerson = this.persons[this.persons.length - 1];
    if (!lastPerson) {
      throw new Error("Must add a person before adding expense");
    }

    // Insert into database using actual schema
    const [expense] = await db
      .insert(expenses)
      .values({
        personId: lastPerson.id,
        name: data?.name || "Test Expense",
        amount: data?.amount || "1000",
        frequency: data?.frequency || "monthly",
        category: data?.category || "living",
        isFixed: data?.isFixed || false,
        startDate: data?.startDate || null,
        endDate: data?.endDate || null,
        isActive: data?.isActive ?? true,
      })
      .returning();

    if (!lastPerson.expenses) lastPerson.expenses = [];
    lastPerson.expenses.push(expense);

    return this;
  }

  /**
   * Add a savings account to the last added person
   */
  async addSavingsAccount(data?: {
    name?: string;
    currentBalance?: string;
    interestRate?: string;
    accountType?: string;
    monthlyDeposit?: string;
  }): Promise<TestDataBuilder> {
    const lastPerson = this.persons[this.persons.length - 1];
    if (!lastPerson) {
      throw new Error("Must add a person before adding savings account");
    }

    // Insert into database using actual schema
    const [savingsAccount] = await db
      .insert(savingsAccounts)
      .values({
        personId: lastPerson.id,
        name: data?.name || "Test Savings",
        currentBalance: data?.currentBalance || "10000",
        interestRate: data?.interestRate || "0.02",
        accountType: data?.accountType || "savings",
        monthlyDeposit: data?.monthlyDeposit || null,
      })
      .returning();

    if (!lastPerson.savingsAccounts) lastPerson.savingsAccounts = [];
    lastPerson.savingsAccounts.push(savingsAccount);

    return this;
  }

  /**
   * Add a loan to the last added person
   */
  async addLoan(data?: {
    name?: string;
    originalAmount?: string;
    currentBalance?: string;
    interestRate?: string;
    monthlyPayment?: string;
    loanType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TestDataBuilder> {
    const lastPerson = this.persons[this.persons.length - 1];
    if (!lastPerson) {
      throw new Error("Must add a person before adding loan");
    }

    const originalAmount = data?.originalAmount || "25000";
    const currentBalance = data?.currentBalance || originalAmount;
    const interestRate = data?.interestRate || "0.05";
    const monthlyPayment =
      data?.monthlyPayment || (parseFloat(originalAmount) * 0.01).toString(); // Default to 1% of original

    // Insert into database using actual schema
    const [loan] = await db
      .insert(loans)
      .values({
        personId: lastPerson.id,
        name: data?.name || "Test Loan",
        originalAmount,
        currentBalance,
        interestRate,
        monthlyPayment,
        loanType: data?.loanType || "personal",
        startDate: data?.startDate || new Date(),
        endDate: data?.endDate || null,
      })
      .returning();

    if (!lastPerson.loans) lastPerson.loans = [];
    lastPerson.loans.push(loan);

    return this;
  }

  /**
   * Add a broker account to the last added person
   */
  async addBrokerAccount(data?: {
    name?: string;
    brokerName?: string;
    accountType?: string;
    currentValue?: string;
  }): Promise<TestDataBuilder> {
    const lastPerson = this.persons[this.persons.length - 1];
    if (!lastPerson) {
      throw new Error("Must add a person before adding broker account");
    }

    // Insert into database using actual schema
    const [brokerAccount] = await db
      .insert(brokerAccounts)
      .values({
        personId: lastPerson.id,
        name: data?.name || "Test Broker Account",
        brokerName: data?.brokerName || "Test Broker",
        accountType: data?.accountType || "investment",
        currentValue: data?.currentValue || "50000",
      })
      .returning();

    if (!lastPerson.brokerAccounts) lastPerson.brokerAccounts = [];
    lastPerson.brokerAccounts.push(brokerAccount);

    return this;
  }

  /**
   * Add a savings goal to the household with optional linked accounts
   */
  async addSavingsGoal(data?: {
    name?: string;
    description?: string;
    targetAmount?: string;
    priority?: number;
    category?: string;
    linkedAccountIds?: number[];
  }): Promise<TestDataBuilder> {
    if (!this.user) {
      throw new Error("Must create a user before adding savings goal");
    }

    // Insert into database using actual schema
    const [savingsGoal] = await db
      .insert(savingsGoals)
      .values({
        householdId: this.user.householdId,
        name: data?.name || "Test Savings Goal",
        description: data?.description || null,
        targetAmount: data?.targetAmount || "10000",
        priority: data?.priority || 1,
        category: data?.category || null,
      })
      .returning();

    // Link savings accounts if provided
    if (data?.linkedAccountIds && data.linkedAccountIds.length > 0) {
      await db.insert(savingsGoalAccounts).values(
        data.linkedAccountIds.map((accountId) => ({
          savingsGoalId: savingsGoal.id,
          savingsAccountId: accountId,
        }))
      );
    }

    return this;
  }

  /**
   * Get the built user with all their data
   */
  build(): TestUser & { persons: TestPerson[] } {
    if (!this.user) {
      throw new Error("Must create a user first");
    }

    return {
      ...this.user,
      persons: this.persons,
    };
  }

  /**
   * Get just the user data without persons
   */
  getUser(): TestUser {
    if (!this.user) {
      throw new Error("Must create a user first");
    }
    return this.user;
  }

  /**
   * Get the persons array
   */
  getPersons(): TestPerson[] {
    return this.persons;
  }
}

/**
 * Setup basic test users for integration tests (without any entities)
 */
export async function setupTestUsers() {
  // Create two test users for cross-user testing
  const user1 = await TestDataBuilder.createUser("TestUser1");
  const user2 = await TestDataBuilder.createUser("TestUser2");

  return {
    user1: user1.getUser(),
    user2: user2.getUser(),
  };
}

/**
 * Authenticated $fetch wrapper that automatically includes session cookie
 * @param user - TestUser with sessionCookie for authentication
 * @param url - API endpoint to call
 * @param options - Additional fetch options (method, body, etc.)
 * @returns Promise with the API response
 */
export async function authenticatedFetch<T = unknown>(
  user: TestUser,
  url: string,
  options: Parameters<typeof $fetch>[1] = {}
): Promise<T> {
  const cookieHeader = `better-auth.session_token=${user.sessionCookie}`;

  return $fetch<T>(url, {
    ...options,
    headers: {
      ...options.headers,
      cookie: cookieHeader,
    },
  });
}

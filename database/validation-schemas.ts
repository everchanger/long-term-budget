import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { positiveDecimalString, percentageString } from "./validation-helpers";
import { users } from "./schema/users";
import { households } from "./schema/households";
import { persons } from "./schema/persons";
import { incomeSources } from "./schema/income-sources";
import { expenses } from "./schema/expenses";
import { savingsAccounts } from "./schema/savings-accounts";
import { savingsGoals } from "./schema/savings-goals";
import { loans } from "./schema/loans";
import { brokerAccounts } from "./schema/broker-accounts";
import { scenarios } from "./schema/scenarios";
import { budgets } from "./schema/budgets";
import { budgetExpenses } from "./schema/budget-expenses";

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export const selectUserSchema = createSelectSchema(users);

export const updateUserSchema = insertUserSchema
  .partial()
  .omit({ id: true, createdAt: true });

// Household schemas
export const insertHouseholdSchema = createInsertSchema(households, {
  name: z
    .string()
    .min(1, "Household name is required")
    .min(2, "Name must be at least 2 characters"),
  userId: z.number().positive("User ID is required"),
});

export const selectHouseholdSchema = createSelectSchema(households);

export const updateHouseholdSchema = insertHouseholdSchema
  .partial()
  .omit({ id: true, createdAt: true, userId: true });

// Person schemas
export const insertPersonSchema = createInsertSchema(persons, {
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  age: z
    .number()
    .min(0, "Age must be positive")
    .max(150, "Age must be realistic")
    .optional(),
  householdId: z.number().positive("Household ID is required"),
});

export const selectPersonSchema = createSelectSchema(persons);

export const updatePersonSchema = insertPersonSchema
  .partial()
  .omit({ id: true, createdAt: true, householdId: true });

// Income Source schemas
export const insertIncomeSourceSchema = createInsertSchema(incomeSources, {
  name: z.string().min(1, "Income source name is required"),
  amount: positiveDecimalString(),
  frequency: z.enum(["monthly", "yearly", "weekly", "daily"]),
  personId: z.number().positive("Person ID is required"),
});

export const selectIncomeSourceSchema = createSelectSchema(incomeSources);

export const updateIncomeSourceSchema = insertIncomeSourceSchema
  .partial()
  .omit({ id: true, createdAt: true, personId: true });

// Expense schemas
export const insertExpenseSchema = createInsertSchema(expenses, {
  name: z.string().min(1, "Expense name is required"),
  amount: positiveDecimalString(),
  frequency: z.enum(["monthly", "yearly", "weekly", "daily"]),
  category: z.string().min(1, "Category is required").optional(),
  personId: z.number().positive("Person ID is required"),
});

export const selectExpenseSchema = createSelectSchema(expenses);

export const updateExpenseSchema = insertExpenseSchema
  .partial()
  .omit({ id: true, createdAt: true, personId: true });

// Savings Account schemas
export const insertSavingsAccountSchema = createInsertSchema(savingsAccounts, {
  name: z.string().min(1, "Account name is required"),
  currentBalance: positiveDecimalString(),
  interestRate: percentageString().optional(),
  monthlyDeposit: positiveDecimalString().optional(),
  accountType: z.string().optional(),
  personId: z.number().positive("Person ID is required"),
});

export const selectSavingsAccountSchema = createSelectSchema(savingsAccounts);

export const updateSavingsAccountSchema = insertSavingsAccountSchema
  .partial()
  .omit({ id: true, createdAt: true, personId: true });

// Loan schemas
export const insertLoanSchema = createInsertSchema(loans, {
  name: z.string().min(1, "Loan name is required"),
  originalAmount: positiveDecimalString(),
  currentBalance: positiveDecimalString(),
  interestRate: percentageString(),
  monthlyPayment: positiveDecimalString(),
  loanType: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional().nullable(),
  personId: z.number().positive("Person ID is required"),
});

export const selectLoanSchema = createSelectSchema(loans);

export const updateLoanSchema = insertLoanSchema
  .partial()
  .omit({ id: true, createdAt: true, personId: true });

// Broker Account schemas
// Broker Account schemas
export const insertBrokerAccountSchema = createInsertSchema(brokerAccounts, {
  name: z.string().min(1, "Broker account name is required"),
  currentValue: positiveDecimalString(),
  accountType: z.string().optional(),
  personId: z.number().positive("Person ID is required"),
});

export const selectBrokerAccountSchema = createSelectSchema(brokerAccounts);

export const updateBrokerAccountSchema = insertBrokerAccountSchema
  .partial()
  .omit({ id: true, createdAt: true, personId: true });

// Savings Goals schemas
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals, {
  name: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  targetAmount: positiveDecimalString(),
  priority: z.number().int().min(1).max(3).default(1),
  category: z.string().optional(),
  householdId: z.number().positive("Household ID is required"),
}).extend({
  savingsAccountIds: z.array(z.number().positive()).optional(),
});

export const selectSavingsGoalSchema = createSelectSchema(savingsGoals);

export const updateSavingsGoalSchema = insertSavingsGoalSchema
  .partial()
  .omit({ id: true, createdAt: true, updatedAt: true, householdId: true });

// Scenario schemas
export const insertScenarioSchema = createInsertSchema(scenarios, {
  name: z.string().min(1, "Scenario name is required"),
  description: z.string().optional(),
  householdId: z.number().positive("Household ID is required"),
});

export const selectScenarioSchema = createSelectSchema(scenarios);

export const updateScenarioSchema = insertScenarioSchema
  .partial()
  .omit({ id: true, createdAt: true, householdId: true });

// Export all schemas
export const schemas = {
  // User schemas
  insertUser: insertUserSchema,
  selectUser: selectUserSchema,
  updateUser: updateUserSchema,

  // Household schemas
  insertHousehold: insertHouseholdSchema,
  selectHousehold: selectHouseholdSchema,
  updateHousehold: updateHouseholdSchema,

  // Person schemas
  insertPerson: insertPersonSchema,
  selectPerson: selectPersonSchema,
  updatePerson: updatePersonSchema,

  // Income source schemas
  insertIncomeSource: insertIncomeSourceSchema,
  selectIncomeSource: selectIncomeSourceSchema,
  updateIncomeSource: updateIncomeSourceSchema,

  // Expense schemas
  insertExpense: insertExpenseSchema,
  selectExpense: selectExpenseSchema,
  updateExpense: updateExpenseSchema,

  // Savings account schemas
  insertSavingsAccount: insertSavingsAccountSchema,
  selectSavingsAccount: selectSavingsAccountSchema,
  updateSavingsAccount: updateSavingsAccountSchema,

  // Loan schemas
  insertLoan: insertLoanSchema,
  selectLoan: selectLoanSchema,
  updateLoan: updateLoanSchema,

  // Broker account schemas
  insertBrokerAccount: insertBrokerAccountSchema,
  selectBrokerAccount: selectBrokerAccountSchema,
  updateBrokerAccount: updateBrokerAccountSchema,

  // Savings goals schemas
  insertSavingsGoal: insertSavingsGoalSchema,
  selectSavingsGoal: selectSavingsGoalSchema,
  updateSavingsGoal: updateSavingsGoalSchema,

  // Scenario schemas
  insertScenario: insertScenarioSchema,
  selectScenario: selectScenarioSchema,
  updateScenario: updateScenarioSchema,
} as const;

// Type exports for use in frontend/backend
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type SelectHousehold = z.infer<typeof selectHouseholdSchema>;
export type UpdateHousehold = z.infer<typeof updateHouseholdSchema>;

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type SelectPerson = z.infer<typeof selectPersonSchema>;
export type UpdatePerson = z.infer<typeof updatePersonSchema>;

export type InsertIncomeSource = z.infer<typeof insertIncomeSourceSchema>;
export type SelectIncomeSource = z.infer<typeof selectIncomeSourceSchema>;
export type UpdateIncomeSource = z.infer<typeof updateIncomeSourceSchema>;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type SelectExpense = z.infer<typeof selectExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;

export type InsertSavingsAccount = z.infer<typeof insertSavingsAccountSchema>;
export type SelectSavingsAccount = z.infer<typeof selectSavingsAccountSchema>;
export type UpdateSavingsAccount = z.infer<typeof updateSavingsAccountSchema>;

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type SelectLoan = z.infer<typeof selectLoanSchema>;
export type UpdateLoan = z.infer<typeof updateLoanSchema>;

export type InsertBrokerAccount = z.infer<typeof insertBrokerAccountSchema>;
export type SelectBrokerAccount = z.infer<typeof selectBrokerAccountSchema>;
export type UpdateBrokerAccount = z.infer<typeof updateBrokerAccountSchema>;

export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SelectSavingsGoal = z.infer<typeof selectSavingsGoalSchema>;
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>;

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type SelectScenario = z.infer<typeof selectScenarioSchema>;
export type UpdateScenario = z.infer<typeof updateScenarioSchema>;

// Budget schemas
export const insertBudgetSchema = createInsertSchema(budgets, {
  name: z
    .string()
    .min(1, "Budget name is required")
    .min(2, "Name must be at least 2 characters"),
  householdId: z.number().positive("Household ID is required"),
});

export const selectBudgetSchema = createSelectSchema(budgets);

export const updateBudgetSchema = insertBudgetSchema
  .partial()
  .omit({ id: true, createdAt: true, updatedAt: true, householdId: true });

// Budget expense categories
export const budgetExpenseCategories = [
  "housing",
  "utilities",
  "transportation",
  "food",
  "healthcare",
  "insurance",
  "debt",
  "entertainment",
  "personal",
  "other",
] as const;

export type BudgetExpenseCategory = (typeof budgetExpenseCategories)[number];

// Budget Expense schemas
export const insertBudgetExpenseSchema = createInsertSchema(budgetExpenses, {
  name: z.string().min(1, "Expense name is required"),
  amount: positiveDecimalString(),
  budgetId: z.number().positive("Budget ID is required"),
  category: z.enum(budgetExpenseCategories).default("other"),
});

export const selectBudgetExpenseSchema = createSelectSchema(budgetExpenses);

export const updateBudgetExpenseSchema = insertBudgetExpenseSchema
  .partial()
  .omit({ id: true, createdAt: true, budgetId: true });

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type SelectBudget = z.infer<typeof selectBudgetSchema>;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;

export type InsertBudgetExpense = z.infer<typeof insertBudgetExpenseSchema>;
export type SelectBudgetExpense = z.infer<typeof selectBudgetExpenseSchema>;
export type UpdateBudgetExpense = z.infer<typeof updateBudgetExpenseSchema>;

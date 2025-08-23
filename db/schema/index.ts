import { pgTable, serial, varchar, timestamp, integer, text, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - application users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Households table - containers for persons
export const households = pgTable('households', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Persons table - household members with financial data
export const persons = pgTable('persons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age'),
  householdId: integer('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Income sources for persons
export const incomeSources = pgTable('income_sources', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // monthly, yearly, etc.
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Expenses for persons
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  isFixed: boolean('is_fixed').default(false).notNull(), // fixed vs variable expense
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Savings accounts for persons
export const savingsAccounts = pgTable('savings_accounts', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }), // annual interest rate
  accountType: varchar('account_type', { length: 100 }), // savings, investment, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Loans for persons
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 12, scale: 2 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }).notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 10, scale: 2 }).notNull(),
  loanType: varchar('loan_type', { length: 100 }), // car, mortgage, personal, etc.
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Financial scenarios for modeling
export const scenarios = pgTable('scenarios', {
  id: serial('id').primaryKey(),
  householdId: integer('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  households: many(households),
}))

export const householdsRelations = relations(households, ({ one, many }) => ({
  user: one(users, {
    fields: [households.userId],
    references: [users.id],
  }),
  persons: many(persons),
  scenarios: many(scenarios),
}))

export const personsRelations = relations(persons, ({ one, many }) => ({
  household: one(households, {
    fields: [persons.householdId],
    references: [households.id],
  }),
  incomeSources: many(incomeSources),
  expenses: many(expenses),
  savingsAccounts: many(savingsAccounts),
  loans: many(loans),
}))

export const incomeSourcesRelations = relations(incomeSources, ({ one }) => ({
  person: one(persons, {
    fields: [incomeSources.personId],
    references: [persons.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  person: one(persons, {
    fields: [expenses.personId],
    references: [persons.id],
  }),
}))

export const savingsAccountsRelations = relations(savingsAccounts, ({ one }) => ({
  person: one(persons, {
    fields: [savingsAccounts.personId],
    references: [persons.id],
  }),
}))

export const loansRelations = relations(loans, ({ one }) => ({
  person: one(persons, {
    fields: [loans.personId],
    references: [persons.id],
  }),
}))

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  household: one(households, {
    fields: [scenarios.householdId],
    references: [households.id],
  }),
}))

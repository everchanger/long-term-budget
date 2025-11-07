import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { persons } from "./persons";
import { savingsGoalAccounts } from "./savings-goal-accounts";

export const savingsAccounts = pgTable("savings_accounts", {
  id: serial("id").primaryKey(),
  personId: integer("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  currentBalance: decimal("current_balance", {
    precision: 12,
    scale: 2,
  }).notNull(),
  monthlyDeposit: decimal("monthly_deposit", {
    precision: 12,
    scale: 2,
  }).default("0"), // monthly contribution amount
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }), // annual interest rate
  accountType: varchar("account_type", { length: 100 }), // savings, investment, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savingsAccountsRelations = relations(
  savingsAccounts,
  ({ one, many }) => ({
    person: one(persons, {
      fields: [savingsAccounts.personId],
      references: [persons.id],
    }),
    linkedGoals: many(savingsGoalAccounts),
  })
);

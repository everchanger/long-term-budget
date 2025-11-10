import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { budgets } from "./budgets";

export const budgetExpenses = pgTable("budget_expenses", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BudgetExpense = typeof budgetExpenses.$inferSelect;
export type NewBudgetExpense = typeof budgetExpenses.$inferInsert;

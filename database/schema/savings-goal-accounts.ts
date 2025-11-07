import { pgTable, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { savingsGoals } from "./savings-goals";
import { savingsAccounts } from "./savings-accounts";

export const savingsGoalAccounts = pgTable(
  "savings_goal_accounts",
  {
    savingsGoalId: integer("savings_goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "cascade" }),
    savingsAccountId: integer("savings_account_id")
      .notNull()
      .references(() => savingsAccounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.savingsGoalId, table.savingsAccountId] }),
  })
);

export const savingsGoalAccountsRelations = relations(
  savingsGoalAccounts,
  ({ one }) => ({
    savingsGoal: one(savingsGoals, {
      fields: [savingsGoalAccounts.savingsGoalId],
      references: [savingsGoals.id],
    }),
    savingsAccount: one(savingsAccounts, {
      fields: [savingsGoalAccounts.savingsAccountId],
      references: [savingsAccounts.id],
    }),
  })
);

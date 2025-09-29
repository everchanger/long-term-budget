import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  decimal,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { households } from "./households";

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  priority: integer("priority").default(1), // 1 = low, 2 = medium, 3 = high
  category: varchar("category", { length: 100 }), // emergency fund, vacation, car, house, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  household: one(households, {
    fields: [savingsGoals.householdId],
    references: [households.id],
  }),
}));

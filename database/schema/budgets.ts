import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { households } from "./households";

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" })
    .unique(),
  name: varchar("name", { length: 255 }).notNull().default("Household Budget"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

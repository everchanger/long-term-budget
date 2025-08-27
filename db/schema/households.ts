import { pgTable, serial, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { persons } from "./persons";
import { scenarios } from "./scenarios";

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users relation defined here to avoid circular imports
export const usersRelations = relations(users, ({ many }) => ({
  households: many(households),
}));

export const householdsRelations = relations(households, ({ one, many }) => ({
  user: one(users, {
    fields: [households.userId],
    references: [users.id],
  }),
  persons: many(persons),
  scenarios: many(scenarios),
}));

import { pgTable, serial, varchar, timestamp, integer, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { households } from './households'

export const scenarios = pgTable('scenarios', {
  id: serial('id').primaryKey(),
  householdId: integer('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  household: one(households, {
    fields: [scenarios.householdId],
    references: [households.id],
  }),
}))

import { pgTable, serial, varchar, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { persons } from './persons'

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

export const incomeSourcesRelations = relations(incomeSources, ({ one }) => ({
  person: one(persons, {
    fields: [incomeSources.personId],
    references: [persons.id],
  }),
}))

import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { households } from './households'
import { incomeSources } from './income-sources'
import { expenses } from './expenses'
import { savingsAccounts } from './savings-accounts'
import { loans } from './loans'

export const persons = pgTable('persons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age'),
  householdId: integer('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

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

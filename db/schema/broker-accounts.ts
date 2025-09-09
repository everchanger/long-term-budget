import { pgTable, serial, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { persons } from './persons'

export const brokerAccounts = pgTable('broker_accounts', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  brokerName: varchar('broker_name', { length: 255 }), // e.g., "Fidelity", "Charles Schwab"
  accountType: varchar('account_type', { length: 100 }), // e.g., "401k", "IRA", "Brokerage"
  currentValue: decimal('current_value', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const brokerAccountsRelations = relations(brokerAccounts, ({ one }) => ({
  person: one(persons, {
    fields: [brokerAccounts.personId],
    references: [persons.id],
  }),
}))

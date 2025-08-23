import { pgTable, serial, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { persons } from './persons'

export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 12, scale: 2 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }).notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 10, scale: 2 }).notNull(),
  loanType: varchar('loan_type', { length: 100 }), // car, mortgage, personal, etc.
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const loansRelations = relations(loans, ({ one }) => ({
  person: one(persons, {
    fields: [loans.personId],
    references: [persons.id],
  }),
}))

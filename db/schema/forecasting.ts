import { pgTable, serial, varchar, timestamp, integer, text, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { scenarios } from './scenarios'

// Scenario modifications - changes to apply to base data for a scenario
export const scenarioModifications = pgTable('scenario_modifications', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'income_change', 'expense_change', 'loan_payoff', 'new_investment', etc.
  targetId: integer('target_id'), // ID of the entity being modified (income source, loan, etc.)
  targetType: varchar('target_type', { length: 50 }), // 'income_source', 'loan', 'expense', etc.
  modification: text('modification').notNull(), // JSON with modification details
  effectiveDate: timestamp('effective_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Projection results - calculated forecast data
export const projections = pgTable('projections', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  projectionDate: timestamp('projection_date').notNull(),
  totalIncome: decimal('total_income', { precision: 12, scale: 2 }).notNull().default('0'),
  totalExpenses: decimal('total_expenses', { precision: 12, scale: 2 }).notNull().default('0'),
  totalSavings: decimal('total_savings', { precision: 12, scale: 2 }).notNull().default('0'),
  totalInvestments: decimal('total_investments', { precision: 12, scale: 2 }).notNull().default('0'),
  totalDebt: decimal('total_debt', { precision: 12, scale: 2 }).notNull().default('0'),
  interestPaid: decimal('interest_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  netWorth: decimal('net_worth', { precision: 12, scale: 2 }).notNull().default('0'),
  cashFlow: decimal('cash_flow', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Scenario comparison results
export const scenarioComparisons = pgTable('scenario_comparisons', {
  id: serial('id').primaryKey(),
  baselineScenarioId: integer('baseline_scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  comparisonScenarioId: integer('comparison_scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  comparisonData: text('comparison_data').notNull(), // JSON with detailed comparison metrics
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const scenarioModificationsRelations = relations(scenarioModifications, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioModifications.scenarioId],
    references: [scenarios.id],
  }),
}))

export const projectionsRelations = relations(projections, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [projections.scenarioId],
    references: [scenarios.id],
  }),
}))

export const scenarioComparisonsRelations = relations(scenarioComparisons, ({ one }) => ({
  baselineScenario: one(scenarios, {
    fields: [scenarioComparisons.baselineScenarioId],
    references: [scenarios.id],
  }),
  comparisonScenario: one(scenarios, {
    fields: [scenarioComparisons.comparisonScenarioId],
    references: [scenarios.id],
  }),
}))

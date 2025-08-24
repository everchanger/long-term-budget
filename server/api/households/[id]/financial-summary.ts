import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../../../../db'

const paramsSchema = z.object({
  id: z.string().transform(Number)
})

export default defineEventHandler(async (event) => {
  try {
    // Validate params
    const { id: householdId } = await getValidatedRouterParams(event, paramsSchema.parse)

    // Check if household exists
    const household = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, householdId))
      .limit(1)

    if (!household.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Household not found'
      })
    }

    // Get all persons in the household
    const householdPersons = await db
      .select()
      .from(schema.persons)
      .where(eq(schema.persons.householdId, householdId))

    const personIds = householdPersons.map((p: any) => p.id)

    if (personIds.length === 0) {
      return {
        totalMonthlyIncome: 0,
        totalAnnualIncome: 0,
        totalSavings: 0,
        totalInvestments: 0,
        totalDebt: 0,
        memberCount: 0,
        incomeSourcesCount: 0,
        loansCount: 0,
        savingsAccountsCount: 0,
        investmentAccountsCount: 0
      }
    }

    // Calculate total monthly income from active income sources
    const incomeResult = await db
      .select({
        amount: schema.incomeSources.amount,
        frequency: schema.incomeSources.frequency
      })
      .from(schema.incomeSources)
      .where(
        sql`${schema.incomeSources.personId} IN (${sql.join(personIds, sql`, `)}) AND ${schema.incomeSources.isActive} = true`
      )

    let totalMonthlyIncome = 0
    let incomeSourcesCount = 0

    for (const income of incomeResult) {
      incomeSourcesCount++
      const amount = parseFloat(income.amount)
      
      switch (income.frequency) {
        case 'monthly':
          totalMonthlyIncome += amount
          break
        case 'yearly':
          totalMonthlyIncome += amount / 12
          break
        case 'weekly':
          totalMonthlyIncome += amount * 4.33
          break
        case 'bi-weekly':
          totalMonthlyIncome += amount * 2.17
          break
      }
    }

    // Calculate total debt from loans
    const loansResult = await db
      .select({
        currentBalance: schema.loans.currentBalance
      })
      .from(schema.loans)
      .where(
        sql`${schema.loans.personId} IN (${sql.join(personIds, sql`, `)})`
      )

    const totalDebt = loansResult.reduce((sum: number, loan: any) => {
      return sum + parseFloat(loan.currentBalance || '0')
    }, 0)

    // Calculate total savings
    const savingsResult = await db
      .select({
        currentBalance: schema.savingsAccounts.currentBalance
      })
      .from(schema.savingsAccounts)
      .where(
        sql`${schema.savingsAccounts.personId} IN (${sql.join(personIds, sql`, `)})`
      )

    const totalSavings = savingsResult.reduce((sum: number, savings: any) => {
      return sum + parseFloat(savings.currentBalance || '0')
    }, 0)

    // Calculate total investments
    const investmentsResult = await db
      .select({
        currentValue: schema.brokerAccounts.currentValue
      })
      .from(schema.brokerAccounts)
      .where(
        sql`${schema.brokerAccounts.personId} IN (${sql.join(personIds, sql`, `)})`
      )

    const totalInvestments = investmentsResult.reduce((sum: number, investment: any) => {
      return sum + parseFloat(investment.currentValue || '0')
    }, 0)

    // Count various account types
    const loansCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.loans)
      .where(sql`${schema.loans.personId} IN (${sql.join(personIds, sql`, `)})`)

    const savingsAccountsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.savingsAccounts)
      .where(sql`${schema.savingsAccounts.personId} IN (${sql.join(personIds, sql`, `)})`)

    const investmentAccountsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.brokerAccounts)
      .where(sql`${schema.brokerAccounts.personId} IN (${sql.join(personIds, sql`, `)})`)

    return {
      totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
      totalAnnualIncome: Math.round(totalMonthlyIncome * 12 * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      totalDebt: Math.round(totalDebt * 100) / 100,
      memberCount: personIds.length,
      incomeSourcesCount,
      loansCount: loansCount[0]?.count || 0,
      savingsAccountsCount: savingsAccountsCount[0]?.count || 0,
      investmentAccountsCount: investmentAccountsCount[0]?.count || 0
    }

  } catch (error) {
    console.error('Error fetching household financial summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch household financial summary'
    })
  }
})

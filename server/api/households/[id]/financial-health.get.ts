import { parseIdParam } from '../../../utils/api-helpers'
import { verifyHouseholdAccessOrThrow } from '../../../utils/authorization'
import { toMonthlyAmount } from '../../../../utils/financial-calculations'
import { successResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  const session = event.context.session
  const householdIdNum = parseIdParam(event, 'id', 'Household ID is required')

  const db = useDrizzle()

  // Verify household exists and belongs to the current user
  await verifyHouseholdAccessOrThrow(session, householdIdNum, db)

  // Get all persons in the household
  const householdPersons = await db
    .select()
    .from(tables.persons)
    .where(eq(tables.persons.householdId, householdIdNum))

  const personIds = householdPersons.map((p) => p.id)

  // Fetch all financial data in parallel
  const [incomeData, expenseData, savingsData, loanData, brokerData] = await Promise.all([
    // Income sources
    personIds.length > 0
      ? db
          .select()
          .from(tables.incomeSources)
          .where(
            sql`${tables.incomeSources.personId} IN (${sql.join(personIds, sql`, `)}) AND ${tables.incomeSources.isActive} = true`,
          )
      : [],

    // Budget expenses (via budget table)
    db
      .select({
        amount: tables.budgetExpenses.amount,
        name: tables.budgetExpenses.name,
        category: tables.budgetExpenses.category,
      })
      .from(tables.budgetExpenses)
      .innerJoin(tables.budgets, eq(tables.budgetExpenses.budgetId, tables.budgets.id))
      .where(eq(tables.budgets.householdId, householdIdNum)),

    // Savings accounts
    personIds.length > 0
      ? db
          .select()
          .from(tables.savingsAccounts)
          .where(sql`${tables.savingsAccounts.personId} IN (${sql.join(personIds, sql`, `)})`)
      : [],

    // Loans
    personIds.length > 0
      ? db
          .select()
          .from(tables.loans)
          .where(sql`${tables.loans.personId} IN (${sql.join(personIds, sql`, `)})`)
      : [],

    // Broker accounts
    personIds.length > 0
      ? db
          .select()
          .from(tables.brokerAccounts)
          .where(sql`${tables.brokerAccounts.personId} IN (${sql.join(personIds, sql`, `)})`)
      : [],
  ])

  // Calculate monthly income
  const monthlyIncome = incomeData.reduce((sum, income) => {
    return sum + toMonthlyAmount(parseFloat(income.amount), income.frequency)
  }, 0)

  // Calculate monthly expenses
  const monthlyExpenses = expenseData.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount)
  }, 0)

  // Calculate total savings (savings accounts + broker accounts)
  const totalSavings = savingsData.reduce((sum, account) => {
    return sum + parseFloat(account.currentBalance)
  }, 0)

  const totalInvestments = brokerData.reduce((sum, account) => {
    return sum + parseFloat(account.currentValue)
  }, 0)

  // Calculate total debt and monthly payments
  const totalDebt = loanData.reduce((sum, loan) => {
    return sum + parseFloat(loan.currentBalance)
  }, 0)

  const monthlyDebtPayments = loanData.reduce((sum, loan) => {
    return sum + parseFloat(loan.monthlyPayment)
  }, 0)

  // Calculate key metrics
  const netWorth = totalSavings + totalInvestments - totalDebt
  const monthlyCashFlow = monthlyIncome - monthlyExpenses - monthlyDebtPayments
  const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0
  const emergencyFundMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0

  // Health indicators (based on financial planning best practices)
  const getDebtHealthStatus = (dti: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (dti <= 20) return 'excellent'
    if (dti <= 36) return 'good'
    if (dti <= 43) return 'fair'
    return 'poor'
  }

  const getEmergencyFundStatus = (months: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (months >= 6) return 'excellent'
    if (months >= 3) return 'good'
    if (months >= 1) return 'fair'
    return 'poor'
  }

  const getCashFlowStatus = (cashFlow: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    const savingsRate = monthlyIncome > 0 ? (cashFlow / monthlyIncome) * 100 : 0
    if (savingsRate >= 20) return 'excellent'
    if (savingsRate >= 10) return 'good'
    if (savingsRate >= 0) return 'fair'
    return 'poor'
  }

  return successResponse({
    netWorth: {
      total: netWorth,
      assets: totalSavings + totalInvestments,
      liabilities: totalDebt,
      breakdown: {
        savings: totalSavings,
        investments: totalInvestments,
        debt: totalDebt,
      },
    },
    cashFlow: {
      monthly: {
        income: monthlyIncome,
        expenses: monthlyExpenses,
        debtPayments: monthlyDebtPayments,
        netCashFlow: monthlyCashFlow,
      },
      annual: {
        income: monthlyIncome * 12,
        expenses: monthlyExpenses * 12,
        debtPayments: monthlyDebtPayments * 12,
        netCashFlow: monthlyCashFlow * 12,
      },
      savingsRate: monthlyIncome > 0 ? (monthlyCashFlow / monthlyIncome) * 100 : 0,
      status: getCashFlowStatus(monthlyCashFlow),
    },
    debtToIncome: {
      ratio: debtToIncomeRatio,
      monthlyPayments: monthlyDebtPayments,
      monthlyIncome,
      status: getDebtHealthStatus(debtToIncomeRatio),
    },
    emergencyFund: {
      currentBalance: totalSavings,
      monthsOfExpenses: emergencyFundMonths,
      targetMonths: 6,
      isAdequate: emergencyFundMonths >= 3,
      status: getEmergencyFundStatus(emergencyFundMonths),
    },
    summary: {
      overallHealth:
        getDebtHealthStatus(debtToIncomeRatio) === 'excellent' &&
        getEmergencyFundStatus(emergencyFundMonths) === 'excellent' &&
        getCashFlowStatus(monthlyCashFlow) === 'excellent'
          ? 'excellent'
          : getDebtHealthStatus(debtToIncomeRatio) === 'poor' ||
              getEmergencyFundStatus(emergencyFundMonths) === 'poor' ||
              getCashFlowStatus(monthlyCashFlow) === 'poor'
            ? 'poor'
            : getDebtHealthStatus(debtToIncomeRatio) === 'fair' ||
                getEmergencyFundStatus(emergencyFundMonths) === 'fair' ||
                getCashFlowStatus(monthlyCashFlow) === 'fair'
              ? 'fair'
              : 'good',
    },
  })
})

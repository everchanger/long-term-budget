import { db } from '../../db'
import * as schema from '../../db/schema'
import { eq } from 'drizzle-orm'

// Types for financial calculations
export interface FinancialSnapshot {
  date: Date
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  totalInvestments: number
  totalDebt: number
  interestPaid: number
  netWorth: number
  cashFlow: number
}

export interface ScenarioModification {
  type: 'income_change' | 'expense_change' | 'loan_payoff' | 'new_investment' | 'new_income' | 'new_expense'
  targetId?: number
  targetType?: string
  amount?: number
  description?: string
  effectiveDate: Date
  endDate?: Date
  frequency?: 'monthly' | 'yearly' | 'one_time'
}

export interface ProjectionParams {
  householdId: number
  startDate: Date
  endDate: Date
  modifications?: ScenarioModification[]
}

export class ForecastingEngine {
  /**
   * Calculate financial projections for a given timeframe
   */
  static async calculateProjections(params: ProjectionParams): Promise<FinancialSnapshot[]> {
    const { householdId, startDate, endDate, modifications = [] } = params
    
    // Get baseline financial data
    const baselineData = await this.getBaselineData(householdId)
    
    const projections: FinancialSnapshot[] = []
    const currentDate = new Date(startDate)
    
    // Generate monthly snapshots
    while (currentDate <= endDate) {
      const snapshot = await this.calculateMonthlySnapshot(
        baselineData,
        currentDate,
        modifications
      )
      
      projections.push(snapshot)
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return projections
  }
  
  /**
   * Get baseline financial data for a household
   */
  private static async getBaselineData(householdId: number) {
    // Get all persons in household
    const persons = await db.query.persons.findMany({
      where: eq(schema.persons.householdId, householdId),
      with: {
        incomeSources: true,
        expenses: true,
        savingsAccounts: true,
        loans: true,
        brokerAccounts: true,
      }
    })
    
    return {
      persons,
      totalMonthlyIncome: this.calculateTotalMonthlyIncome(persons),
      totalMonthlyExpenses: this.calculateTotalMonthlyExpenses(persons),
      totalSavings: this.calculateTotalSavings(persons),
      totalInvestments: this.calculateTotalInvestments(persons),
      totalDebt: this.calculateTotalDebt(persons),
    }
  }
  
  /**
   * Calculate a single monthly snapshot
   */
  private static async calculateMonthlySnapshot(
    baselineData: any,
    date: Date,
    modifications: ScenarioModification[]
  ): Promise<FinancialSnapshot> {
    // Apply modifications that are effective for this date
    const activeModifications = modifications.filter(mod => 
      mod.effectiveDate <= date && 
      (!mod.endDate || mod.endDate >= date)
    )
    
    // Start with baseline data
    let monthlyIncome = baselineData.totalMonthlyIncome
    let monthlyExpenses = baselineData.totalMonthlyExpenses
    let totalSavings = baselineData.totalSavings
    let totalInvestments = baselineData.totalInvestments
    let totalDebt = baselineData.totalDebt
    let interestPaid = 0
    
    // Apply modifications
    for (const mod of activeModifications) {
      switch (mod.type) {
        case 'income_change':
          monthlyIncome += mod.amount || 0
          break
        case 'expense_change':
          monthlyExpenses += mod.amount || 0
          break
        case 'loan_payoff':
          if (mod.targetId && mod.amount) {
            totalDebt = Math.max(0, totalDebt - mod.amount)
            monthlyExpenses += mod.amount // Add payment to expenses
          }
          break
        case 'new_investment':
          if (mod.amount) {
            totalInvestments += mod.amount
            monthlyExpenses += mod.amount // Investment counts as expense
          }
          break
        case 'new_income':
          monthlyIncome += mod.amount || 0
          break
        case 'new_expense':
          monthlyExpenses += mod.amount || 0
          break
      }
    }
    
    // Calculate interest on remaining debt
    interestPaid = this.calculateMonthlyInterest(baselineData.persons, totalDebt)
    
    // Calculate cash flow and net worth
    const cashFlow = monthlyIncome - monthlyExpenses
    totalSavings += cashFlow // Assume excess cash goes to savings
    const netWorth = totalSavings + totalInvestments - totalDebt
    
    return {
      date: new Date(date),
      totalIncome: monthlyIncome,
      totalExpenses: monthlyExpenses,
      totalSavings,
      totalInvestments,
      totalDebt,
      interestPaid,
      netWorth,
      cashFlow,
    }
  }
  
  /**
   * Calculate total monthly income across all persons
   */
  private static calculateTotalMonthlyIncome(persons: any[]): number {
    return persons.reduce((total, person) => {
      return total + person.incomeSources.reduce((personTotal: number, income: any) => {
        if (!income.isActive) return personTotal
        
        switch (income.frequency) {
          case 'monthly':
            return personTotal + Number(income.amount)
          case 'yearly':
            return personTotal + (Number(income.amount) / 12)
          case 'weekly':
            return personTotal + (Number(income.amount) * 52 / 12)
          case 'bi_weekly':
            return personTotal + (Number(income.amount) * 26 / 12)
          default:
            return personTotal
        }
      }, 0)
    }, 0)
  }
  
  /**
   * Calculate total monthly expenses across all persons
   */
  private static calculateTotalMonthlyExpenses(persons: any[]): number {
    return persons.reduce((total, person) => {
      return total + person.expenses.reduce((personTotal: number, expense: any) => {
        if (!expense.isActive) return personTotal
        
        switch (expense.frequency) {
          case 'monthly':
            return personTotal + Number(expense.amount)
          case 'yearly':
            return personTotal + (Number(expense.amount) / 12)
          case 'weekly':
            return personTotal + (Number(expense.amount) * 52 / 12)
          default:
            return personTotal
        }
      }, 0)
    }, 0)
  }
  
  /**
   * Calculate total savings across all persons
   */
  private static calculateTotalSavings(persons: any[]): number {
    return persons.reduce((total, person) => {
      return total + person.savingsAccounts.reduce((personTotal: number, account: any) => {
        return personTotal + Number(account.balance)
      }, 0)
    }, 0)
  }
  
  /**
   * Calculate total investments across all persons
   */
  private static calculateTotalInvestments(persons: any[]): number {
    return persons.reduce((total, person) => {
      return total + person.brokerAccounts.reduce((personTotal: number, account: any) => {
        return personTotal + Number(account.balance)
      }, 0)
    }, 0)
  }
  
  /**
   * Calculate total debt across all persons
   */
  private static calculateTotalDebt(persons: any[]): number {
    return persons.reduce((total, person) => {
      return total + person.loans.reduce((personTotal: number, loan: any) => {
        return personTotal + Number(loan.balance)
      }, 0)
    }, 0)
  }
  
  /**
   * Calculate monthly interest payments
   */
  private static calculateMonthlyInterest(persons: any[], currentDebt: number): number {
    return persons.reduce((total, person) => {
      return total + person.loans.reduce((personTotal: number, loan: any) => {
        const monthlyRate = Number(loan.interestRate) / 100 / 12
        const monthlyInterest = Number(loan.balance) * monthlyRate
        return personTotal + monthlyInterest
      }, 0)
    }, 0)
  }
  
  /**
   * Save projections to database
   */
  static async saveProjections(scenarioId: number, projections: FinancialSnapshot[]): Promise<void> {
    // Delete existing projections for this scenario
    await db.delete(schema.projections).where(eq(schema.projections.scenarioId, scenarioId))
    
    // Insert new projections
    for (const projection of projections) {
      await db.insert(schema.projections).values({
        scenarioId,
        projectionDate: projection.date,
        totalIncome: projection.totalIncome.toString(),
        totalExpenses: projection.totalExpenses.toString(),
        totalSavings: projection.totalSavings.toString(),
        totalInvestments: projection.totalInvestments.toString(),
        totalDebt: projection.totalDebt.toString(),
        interestPaid: projection.interestPaid.toString(),
        netWorth: projection.netWorth.toString(),
        cashFlow: projection.cashFlow.toString(),
      })
    }
  }
  
  /**
   * Compare two scenarios
   */
  static async compareScenarios(baselineScenarioId: number, comparisonScenarioId: number) {
    const baselineProjections = await db.query.projections.findMany({
      where: eq(schema.projections.scenarioId, baselineScenarioId),
      orderBy: schema.projections.projectionDate
    })
    
    const comparisonProjections = await db.query.projections.findMany({
      where: eq(schema.projections.scenarioId, comparisonScenarioId),
      orderBy: schema.projections.projectionDate
    })
    
    // Calculate differences
    const comparison = baselineProjections.map((baseline: any, index: number) => {
      const comparison = comparisonProjections[index]
      if (!comparison) return null
      
      return {
        date: baseline.projectionDate,
        netWorthDifference: Number(comparison.netWorth) - Number(baseline.netWorth),
        cashFlowDifference: Number(comparison.cashFlow) - Number(baseline.cashFlow),
        interestSavings: Number(baseline.interestPaid) - Number(comparison.interestPaid),
        totalSavingsDifference: Number(comparison.totalSavings) - Number(baseline.totalSavings),
      }
    }).filter(Boolean)
    
    return comparison
  }
}

import { parseIdParam } from "../../../utils/api-helpers";
import { verifyHouseholdAccessOrThrow } from "../../../utils/authorization";
import { toMonthlyAmount } from "../../../../utils/financial-calculations";
import { FinancialProjectionEngine } from "../../../../utils/financial-projection-engine";
import type { ProjectionInputs } from "../../../../utils/financial-projection-engine";
import { successResponse } from "../../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const householdIdNum = parseIdParam(event, "id", "Household ID is required");

  const db = useDrizzle();

  // Verify household access
  await verifyHouseholdAccessOrThrow(session, householdIdNum, db);

  // Get query parameters for adjustments (optional)
  const query = getQuery(event);
  // Use !== undefined to allow 0 values (when assumptions are disabled)
  const incomeGrowthRate =
    query.incomeGrowth !== undefined
      ? parseFloat(query.incomeGrowth as string) / 100
      : 0.03; // Default 3%
  const expenseGrowthRate =
    query.expenseGrowth !== undefined
      ? parseFloat(query.expenseGrowth as string) / 100
      : 0.02; // Default 2%
  const savingsInterestRate =
    query.savingsRate !== undefined
      ? parseFloat(query.savingsRate as string) / 100
      : 0.04; // Default 4%
  const investmentReturnRate =
    query.investmentReturn !== undefined
      ? parseFloat(query.investmentReturn as string) / 100
      : 0.08; // Default 8%
  const additionalMonthlySavings =
    query.additionalSavings !== undefined
      ? parseFloat(query.additionalSavings as string)
      : 0;

  // Parse instrument adjustments (JSON stringified in query param)
  interface InstrumentAdjustment {
    income?: Record<number, { amount?: number; frequency?: string }>;
    savings?: Record<
      number,
      {
        currentBalance?: number;
        monthlyDeposit?: number;
        interestRate?: number;
      }
    >;
    loans?: Record<
      number,
      {
        currentBalance?: number;
        monthlyPayment?: number;
        interestRate?: number;
      }
    >;
    brokers?: Record<number, { currentValue?: number }>;
  }
  const instrumentAdjustments: Record<number, InstrumentAdjustment> = {};
  if (query.adjustments && typeof query.adjustments === "string") {
    try {
      Object.assign(instrumentAdjustments, JSON.parse(query.adjustments));
    } catch (e) {
      // Invalid JSON, ignore adjustments
      console.warn("Failed to parse instrument adjustments:", e);
    }
  }

  // Get all persons in the household
  const householdPersons = await db
    .select()
    .from(tables.persons)
    .where(eq(tables.persons.householdId, householdIdNum));

  const personIds = householdPersons.map((p) => p.id);

  // Fetch all financial data
  const [incomeData, expenseData, savingsData, loanData, brokerData] =
    await Promise.all([
      // Income sources
      personIds.length > 0
        ? db
            .select()
            .from(tables.incomeSources)
            .where(
              sql`${tables.incomeSources.personId} IN (${sql.join(
                personIds,
                sql`, `
              )}) AND ${tables.incomeSources.isActive} = true`
            )
        : [],

      // Budget expenses
      db
        .select({
          amount: tables.budgetExpenses.amount,
          name: tables.budgetExpenses.name,
          category: tables.budgetExpenses.category,
        })
        .from(tables.budgetExpenses)
        .innerJoin(
          tables.budgets,
          eq(tables.budgetExpenses.budgetId, tables.budgets.id)
        )
        .where(eq(tables.budgets.householdId, householdIdNum)),

      // Savings accounts
      personIds.length > 0
        ? db
            .select()
            .from(tables.savingsAccounts)
            .where(
              sql`${tables.savingsAccounts.personId} IN (${sql.join(
                personIds,
                sql`, `
              )})`
            )
        : [],

      // Loans
      personIds.length > 0
        ? db
            .select()
            .from(tables.loans)
            .where(
              sql`${tables.loans.personId} IN (${sql.join(personIds, sql`, `)})`
            )
        : [],

      // Broker accounts
      personIds.length > 0
        ? db
            .select()
            .from(tables.brokerAccounts)
            .where(
              sql`${tables.brokerAccounts.personId} IN (${sql.join(
                personIds,
                sql`, `
              )})`
            )
        : [],
    ]);

  // Calculate current financial state
  const monthlyIncome = incomeData.reduce((sum, income) => {
    // Apply adjustments if present
    const personAdjustments = instrumentAdjustments[income.personId];
    const incomeAdjustment = personAdjustments?.income?.[income.id];

    const amount =
      incomeAdjustment?.amount !== undefined
        ? incomeAdjustment.amount
        : parseFloat(income.amount);
    const frequency =
      incomeAdjustment?.frequency !== undefined
        ? incomeAdjustment.frequency
        : income.frequency;

    return sum + toMonthlyAmount(amount, frequency);
  }, 0);

  const monthlyExpenses = expenseData.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount);
  }, 0);

  const currentSavings = savingsData.reduce((sum, account) => {
    // Apply adjustments if present
    const personAdjustments = instrumentAdjustments[account.personId];
    const savingsAdjustment = personAdjustments?.savings?.[account.id];

    const balance =
      savingsAdjustment?.currentBalance !== undefined
        ? savingsAdjustment.currentBalance
        : parseFloat(account.currentBalance);

    return sum + balance;
  }, 0);

  const currentInvestments = brokerData.reduce((sum, account) => {
    // Apply adjustments if present
    const personAdjustments = instrumentAdjustments[account.personId];
    const brokerAdjustment = personAdjustments?.brokers?.[account.id];

    const value =
      brokerAdjustment?.currentValue !== undefined
        ? brokerAdjustment.currentValue
        : parseFloat(account.currentValue);

    return sum + value;
  }, 0);

  const currentDebt = loanData.reduce((sum, loan) => {
    // Apply adjustments if present
    const personAdjustments = instrumentAdjustments[loan.personId];
    const loanAdjustment = personAdjustments?.loans?.[loan.id];

    const balance =
      loanAdjustment?.currentBalance !== undefined
        ? loanAdjustment.currentBalance
        : parseFloat(loan.currentBalance);

    return sum + balance;
  }, 0);

  const monthlyDebtPayment = loanData.reduce((sum, loan) => {
    // Apply adjustments if present
    const personAdjustments = instrumentAdjustments[loan.personId];
    const loanAdjustment = personAdjustments?.loans?.[loan.id];

    const payment =
      loanAdjustment?.monthlyPayment !== undefined
        ? loanAdjustment.monthlyPayment
        : parseFloat(loan.monthlyPayment);

    return sum + payment;
  }, 0);

  const currentNetWorth = currentSavings + currentInvestments - currentDebt;

  // Get average interest rates
  const avgSavingsRate =
    savingsData.length > 0
      ? savingsData.reduce((sum, account) => {
          const rate = account.interestRate
            ? parseFloat(account.interestRate)
            : 0;
          return sum + rate;
        }, 0) / savingsData.length
      : savingsInterestRate;

  // Broker accounts don't have expectedReturn in schema, use default
  const avgInvestmentRate = investmentReturnRate;

  // Build projection inputs
  const projectionInputs: ProjectionInputs = {
    currentNetWorth,
    currentSavings,
    currentInvestments,
    currentDebt,
    monthlyIncome,
    monthlyExpenses,
    monthlyDebtPayment,
    incomeGrowthRate,
    expenseGrowthRate,
    savingsInterestRate: avgSavingsRate,
    investmentReturnRate: avgInvestmentRate,
    additionalMonthlySavings,
  };

  // Generate projection
  const engine = new FinancialProjectionEngine(projectionInputs);
  const projection = engine.generate();

  // Organize detailed instruments by person
  const personDetails = householdPersons.map((person) => {
    const personIncome = incomeData.filter((i) => i.personId === person.id);
    const personSavings = savingsData.filter((s) => s.personId === person.id);
    const personLoans = loanData.filter((l) => l.personId === person.id);
    const personBrokers = brokerData.filter((b) => b.personId === person.id);

    const personAdjustments = instrumentAdjustments[person.id];

    return {
      person: {
        id: person.id,
        name: person.name,
      },
      incomeSources: personIncome.map((income) => {
        const adjustment = personAdjustments?.income?.[income.id];
        const amount =
          adjustment?.amount !== undefined
            ? adjustment.amount
            : parseFloat(income.amount);
        const frequency =
          adjustment?.frequency !== undefined
            ? adjustment.frequency
            : income.frequency;

        return {
          id: income.id,
          name: income.name,
          amount,
          frequency,
          monthlyAmount: toMonthlyAmount(amount, frequency),
        };
      }),
      savingsAccounts: personSavings.map((account) => {
        const adjustment = personAdjustments?.savings?.[account.id];

        return {
          id: account.id,
          name: account.name,
          currentBalance:
            adjustment?.currentBalance !== undefined
              ? adjustment.currentBalance
              : parseFloat(account.currentBalance),
          monthlyDeposit:
            adjustment?.monthlyDeposit !== undefined
              ? adjustment.monthlyDeposit
              : account.monthlyDeposit
              ? parseFloat(account.monthlyDeposit)
              : 0,
          interestRate:
            adjustment?.interestRate !== undefined
              ? adjustment.interestRate
              : account.interestRate
              ? parseFloat(account.interestRate)
              : 0,
          accountType: account.accountType,
        };
      }),
      loans: personLoans.map((loan) => {
        const adjustment = personAdjustments?.loans?.[loan.id];

        return {
          id: loan.id,
          name: loan.name,
          currentBalance:
            adjustment?.currentBalance !== undefined
              ? adjustment.currentBalance
              : parseFloat(loan.currentBalance),
          monthlyPayment:
            adjustment?.monthlyPayment !== undefined
              ? adjustment.monthlyPayment
              : parseFloat(loan.monthlyPayment),
          interestRate:
            adjustment?.interestRate !== undefined
              ? adjustment.interestRate
              : parseFloat(loan.interestRate),
          loanType: loan.loanType,
        };
      }),
      brokerAccounts: personBrokers.map((account) => {
        const adjustment = personAdjustments?.brokers?.[account.id];

        return {
          id: account.id,
          name: account.name,
          currentValue:
            adjustment?.currentValue !== undefined
              ? adjustment.currentValue
              : parseFloat(account.currentValue),
          brokerName: account.brokerName,
          accountType: account.accountType,
        };
      }),
    };
  });

  // Return projection with metadata and detailed instruments
  return successResponse({
    projection,
    inputs: {
      incomeGrowthRate: incomeGrowthRate * 100, // Convert back to percentage for display
      expenseGrowthRate: expenseGrowthRate * 100,
      savingsInterestRate: avgSavingsRate * 100,
      investmentReturnRate: avgInvestmentRate * 100,
      additionalMonthlySavings,
    },
    currentState: {
      netWorth: currentNetWorth,
      savings: currentSavings,
      investments: currentInvestments,
      debt: currentDebt,
      monthlyIncome,
      monthlyExpenses,
      monthlyDebtPayment,
    },
    persons: personDetails,
    expenses: expenseData.map((expense) => ({
      name: expense.name,
      amount: parseFloat(expense.amount),
      category: expense.category,
    })),
  });
});

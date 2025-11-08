import { parseIdParam } from "../../../utils/api-helpers";
import { verifyHouseholdAccessOrThrow } from "../../../utils/authorization";
import { toMonthlyAmount } from "../../../../utils/financial-calculations";
import { successResponse } from "../../../utils/api-response";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  const householdIdNum = parseIdParam(event, "id", "Household ID is required");

  try {
    const db = useDrizzle();

    // Verify household exists and belongs to the current user
    await verifyHouseholdAccessOrThrow(session, householdIdNum, db);

    // Get all persons in the household
    const householdPersons = await db
      .select()
      .from(tables.persons)
      .where(eq(tables.persons.householdId, householdIdNum));

    const personIds = householdPersons.map((p) => p.id);

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
        investmentAccountsCount: 0,
      };
    }

    // Calculate total monthly income from active income sources
    const incomeResult = await db
      .select({
        amount: tables.incomeSources.amount,
        frequency: tables.incomeSources.frequency,
      })
      .from(tables.incomeSources)
      .where(
        sql`${tables.incomeSources.personId} IN (${sql.join(
          personIds,
          sql`, `
        )}) AND ${tables.incomeSources.isActive} = true`
      );

    let totalMonthlyIncome = 0;
    let incomeSourcesCount = 0;

    for (const income of incomeResult) {
      incomeSourcesCount++;
      totalMonthlyIncome += toMonthlyAmount(income.amount, income.frequency);
    }

    // Calculate total debt from loans
    const loansResult = await db
      .select({
        currentBalance: tables.loans.currentBalance,
      })
      .from(tables.loans)
      .where(
        sql`${tables.loans.personId} IN (${sql.join(personIds, sql`, `)})`
      );

    const totalDebt = loansResult.reduce((sum: number, loan) => {
      return sum + parseFloat(loan.currentBalance || "0");
    }, 0);

    // Calculate total savings
    const savingsResult = await db
      .select({
        currentBalance: tables.savingsAccounts.currentBalance,
      })
      .from(tables.savingsAccounts)
      .where(
        sql`${tables.savingsAccounts.personId} IN (${sql.join(
          personIds,
          sql`, `
        )})`
      );

    const totalSavings = savingsResult.reduce((sum: number, savings) => {
      return sum + parseFloat(savings.currentBalance || "0");
    }, 0);

    // Calculate total investments
    const investmentsResult = await db
      .select({
        currentValue: tables.brokerAccounts.currentValue,
      })
      .from(tables.brokerAccounts)
      .where(
        sql`${tables.brokerAccounts.personId} IN (${sql.join(
          personIds,
          sql`, `
        )})`
      );

    const totalInvestments = investmentsResult.reduce(
      (sum: number, investment) => {
        return sum + parseFloat(investment.currentValue || "0");
      },
      0
    );

    // Count various account types
    const loansCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tables.loans)
      .where(
        sql`${tables.loans.personId} IN (${sql.join(personIds, sql`, `)})`
      );

    const savingsAccountsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tables.savingsAccounts)
      .where(
        sql`${tables.savingsAccounts.personId} IN (${sql.join(
          personIds,
          sql`, `
        )})`
      );

    const investmentAccountsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tables.brokerAccounts)
      .where(
        sql`${tables.brokerAccounts.personId} IN (${sql.join(
          personIds,
          sql`, `
        )})`
      );

    return successResponse({
      totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
      totalAnnualIncome: Math.round(totalMonthlyIncome * 12 * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      totalDebt: Math.round(totalDebt * 100) / 100,
      memberCount: personIds.length,
      incomeSourcesCount,
      loansCount: loansCount[0]?.count || 0,
      savingsAccountsCount: savingsAccountsCount[0]?.count || 0,
      investmentAccountsCount: investmentAccountsCount[0]?.count || 0,
    });
  } catch (error) {
    // Re-throw HTTP errors as-is
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Wrap other errors
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});

import { test, expect } from '@playwright/test'
import { TEST_USER } from './fixtures'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Financial Health Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto(`${BASE_URL}/auth`)
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(`${BASE_URL}/dashboard`)
  })

  test('should display Financial Health link in navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Financial Health' })).toBeVisible()
  })

  test('should navigate to Financial Health Dashboard', async ({ page }) => {
    await page.getByRole('link', { name: 'Financial Health' }).click()
    await page.waitForURL(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Check page title
    await expect(page.getByRole('heading', { name: 'Financial Health Dashboard', level: 1 })).toBeVisible()
    await expect(page.getByText('Track your overall financial wellness')).toBeVisible()
  })

  test('should display overall health summary card', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Overall health card should be visible
    await expect(page.getByRole('heading', { name: 'Overall Financial Health', level: 2 })).toBeVisible()
    await expect(page.getByText('Based on your net worth, cash flow')).toBeVisible()
  })

  test('should display all four metric cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // All cards should be visible
    await expect(page.getByRole('heading', { name: 'Net Worth', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cash Flow', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Debt-to-Income Ratio', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emergency Fund', level: 3 })).toBeVisible()
  })

  test('should display net worth with breakdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Net Worth card content
    const netWorthCard = page.locator('text=Net Worth').locator('..')
    await expect(netWorthCard.getByText('Assets')).toBeVisible()
    await expect(netWorthCard.getByText('Liabilities')).toBeVisible()
    await expect(netWorthCard.getByText('Savings')).toBeVisible()
    await expect(netWorthCard.getByText('Investments')).toBeVisible()
    await expect(netWorthCard.getByText('Debt')).toBeVisible()
  })

  test('should display cash flow metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Cash Flow card content
    await expect(page.getByText('Monthly Net Cash Flow')).toBeVisible()
    await expect(page.getByText('Savings Rate:')).toBeVisible()
    await expect(page.getByText('Income')).toBeVisible()
    await expect(page.getByText('Expenses')).toBeVisible()
    await expect(page.getByText('Debt Payments')).toBeVisible()
    await expect(page.getByText('Annual Net Cash Flow')).toBeVisible()
  })

  test('should display debt-to-income ratio with guidance', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // DTI card content
    await expect(page.getByText('Current DTI Ratio')).toBeVisible()
    await expect(page.getByText('Monthly Debt Payments')).toBeVisible()
    await expect(page.getByText('Monthly Income')).toBeVisible()
    
    // Should have guidance text (one of the possible messages)
    const guidanceTexts = [
      'Excellent! You have plenty of financial flexibility',
      'Good! Your debt is manageable',
      'Consider reducing debt to improve financial health',
      'High debt burden. Focus on debt reduction',
    ]
    const hasGuidance = await page.getByText(new RegExp(guidanceTexts.join('|'))).isVisible()
    expect(hasGuidance).toBeTruthy()
  })

  test('should display emergency fund with progress', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Emergency Fund card content
    await expect(page.getByText('Months of Expenses Covered')).toBeVisible()
    await expect(page.getByText('Current Savings Balance')).toBeVisible()
    
    // Should show target months
    await expect(page.getByText('/ 6')).toBeVisible()
  })

  test('should display recommendations section', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: 'Recommended Actions', level: 3 })).toBeVisible()
  })

  test('should show excellent health status with strong financials', async ({ page }) => {
    // Navigate to economy page to add strong financial data
    await page.goto(`${BASE_URL}/economy`, { waitUntil: 'networkidle' })

    // Click the first person to add financial data
    await page.getByTestId('add-person-button').click()
    await page.getByLabel('Name').fill('Wealthy Person')
    await page.getByLabel('Age').fill('35')
    await page.getByRole('button', { name: 'Add Member' }).click()
    await page.waitForTimeout(1000)

    // Click on the person to view details
    const personCard = page.getByText('Wealthy Person').locator('..')
    await personCard.click()
    await page.waitForURL(/\/persons\/\d+/, { waitUntil: 'networkidle' })

    // Add high income
    await page.getByRole('tab', { name: 'Income Sources' }).click()
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.getByLabel('Name').fill('High Salary')
    await page.getByLabel('Amount').fill('10000')
    await page.getByLabel('Frequency').selectOption('monthly')
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.waitForTimeout(1000)

    // Add savings account (high balance)
    await page.getByRole('tab', { name: 'Savings Accounts' }).click()
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.getByLabel('Account Name').fill('Emergency Fund')
    await page.getByLabel('Current Balance').fill('60000') // 6+ months of $10k salary
    await page.getByLabel('Interest Rate (%)').fill('4.5')
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.waitForTimeout(1000)

    // Go to Financial Health Dashboard
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Should show excellent status
    const excellentBadge = page.getByText('Excellent').first()
    await expect(excellentBadge).toBeVisible()

    // Net worth should be positive and high
    const netWorthCard = page.locator('text=Net Worth').locator('..')
    await expect(netWorthCard.getByText(/\$60,000/)).toBeVisible()

    // Emergency fund should be excellent (6+ months)
    await expect(page.getByText('Months of Expenses Covered')).toBeVisible()
  })

  test('should show poor health status with challenging financials', async ({ page }) => {
    // Navigate to economy page to add challenging financial data
    await page.goto(`${BASE_URL}/economy`, { waitUntil: 'networkidle' })

    // Add a person with poor financial health
    await page.getByTestId('add-person-button').click()
    await page.getByLabel('Name').fill('Struggling Person')
    await page.getByLabel('Age').fill('30')
    await page.getByRole('button', { name: 'Add Member' }).click()
    await page.waitForTimeout(1000)

    // Click on the person
    const personCard = page.getByText('Struggling Person').locator('..')
    await personCard.click()
    await page.waitForURL(/\/persons\/\d+/, { waitUntil: 'networkidle' })

    // Add low income
    await page.getByRole('tab', { name: 'Income Sources' }).click()
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.getByLabel('Name').fill('Low Salary')
    await page.getByLabel('Amount').fill('2000')
    await page.getByLabel('Frequency').selectOption('monthly')
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.waitForTimeout(1000)

    // Add minimal savings
    await page.getByRole('tab', { name: 'Savings Accounts' }).click()
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.getByLabel('Account Name').fill('Minimal Savings')
    await page.getByLabel('Current Balance').fill('500') // Less than 1 month
    await page.getByLabel('Interest Rate (%)').fill('1.0')
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.waitForTimeout(1000)

    // Add high debt with high monthly payment
    await page.getByRole('tab', { name: 'Loans' }).click()
    await page.getByRole('button', { name: 'Add Loan' }).click()
    await page.getByLabel('Loan Name').fill('High Interest Debt')
    await page.getByLabel('Original Amount').fill('30000')
    await page.getByLabel('Current Balance').fill('28000')
    await page.getByLabel('Interest Rate (%)').fill('18.0')
    await page.getByLabel('Monthly Payment').fill('1000') // 50% of income!
    await page.getByLabel('Loan Type').selectOption('Personal Loan')
    await page.getByRole('button', { name: 'Add Loan' }).click()
    await page.waitForTimeout(1000)

    // Go to Financial Health Dashboard
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Should show poor or critical status indicators
    const statusBadges = page.getByText(/Poor|Critical|Needs Attention/)
    await expect(statusBadges.first()).toBeVisible()

    // DTI should be very high (50%)
    await expect(page.getByText('50.0%')).toBeVisible()

    // Should show recommendations for improvement
    await expect(page.getByRole('heading', { name: 'Recommended Actions' })).toBeVisible()
    const recommendations = page.locator('text=Recommended Actions').locator('..')
    await expect(recommendations.getByText(/Reduce Debt|Emergency Fund|Savings/)).toBeVisible()
  })

  test('should show good/fair health with moderate financials', async ({ page }) => {
    // Navigate to economy page
    await page.goto(`${BASE_URL}/economy`, { waitUntil: 'networkidle' })

    // Add a person with moderate financial health
    await page.getByTestId('add-person-button').click()
    await page.getByLabel('Name').fill('Average Person')
    await page.getByLabel('Age').fill('32')
    await page.getByRole('button', { name: 'Add Member' }).click()
    await page.waitForTimeout(1000)

    // Click on the person
    const personCard = page.getByText('Average Person').locator('..')
    await personCard.click()
    await page.waitForURL(/\/persons\/\d+/, { waitUntil: 'networkidle' })

    // Add moderate income
    await page.getByRole('tab', { name: 'Income Sources' }).click()
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.getByLabel('Name').fill('Average Salary')
    await page.getByLabel('Amount').fill('5000')
    await page.getByLabel('Frequency').selectOption('monthly')
    await page.getByRole('button', { name: 'Add Income Source' }).click()
    await page.waitForTimeout(1000)

    // Add moderate savings (3-4 months)
    await page.getByRole('tab', { name: 'Savings Accounts' }).click()
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.getByLabel('Account Name').fill('Savings')
    await page.getByLabel('Current Balance').fill('17500') // ~3.5 months at $5k/mo
    await page.getByLabel('Interest Rate (%)').fill('3.5')
    await page.getByRole('button', { name: 'Add Savings Account' }).click()
    await page.waitForTimeout(1000)

    // Add reasonable debt
    await page.getByRole('tab', { name: 'Loans' }).click()
    await page.getByRole('button', { name: 'Add Loan' }).click()
    await page.getByLabel('Loan Name').fill('Car Loan')
    await page.getByLabel('Original Amount').fill('25000')
    await page.getByLabel('Current Balance').fill('18000')
    await page.getByLabel('Interest Rate (%)').fill('5.5')
    await page.getByLabel('Monthly Payment').fill('450') // 9% of income
    await page.getByLabel('Loan Type').selectOption('Auto Loan')
    await page.getByRole('button', { name: 'Add Loan' }).click()
    await page.waitForTimeout(1000)

    // Go to Financial Health Dashboard
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Should show good or fair status
    const statusText = await page.locator('text=/Good|Fair|Excellent/').first().textContent()
    expect(['Good', 'Fair', 'Excellent']).toContain(statusText?.trim())

    // DTI should be low (< 20%)
    await expect(page.getByText(/9\.\d%/)).toBeVisible()

    // Emergency fund should be fair/good (3-6 months)
    const emergencyCard = page.locator('text=Emergency Fund').locator('..')
    await expect(emergencyCard.getByText(/3\.\d/)).toBeVisible()
  })

  test('should update when navigating back from economy page', async ({ page }) => {
    // Start at financial health
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Navigate to economy and add income
    await page.goto(`${BASE_URL}/economy`, { waitUntil: 'networkidle' })
    
    // If there are persons, click the first one
    const hasPersons = await page.getByTestId('add-person-button').isVisible()
    
    if (hasPersons) {
      // Add a new person
      await page.getByTestId('add-person-button').click()
      await page.getByLabel('Name').fill('Test Update')
      await page.getByLabel('Age').fill('28')
      await page.getByRole('button', { name: 'Add Member' }).click()
      await page.waitForTimeout(1000)
      
      const personCard = page.getByText('Test Update').locator('..')
      await personCard.click()
      await page.waitForURL(/\/persons\/\d+/, { waitUntil: 'networkidle' })
      
      // Add savings
      await page.getByRole('tab', { name: 'Savings Accounts' }).click()
      await page.getByRole('button', { name: 'Add Savings Account' }).click()
      await page.getByLabel('Account Name').fill('New Savings')
      await page.getByLabel('Current Balance').fill('5000')
      await page.getByLabel('Interest Rate (%)').fill('2.5')
      await page.getByRole('button', { name: 'Add Savings Account' }).click()
      await page.waitForTimeout(1000)
    }

    // Navigate back to financial health
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })
    
    // Verify the page loaded with data
    await expect(page.getByRole('heading', { name: 'Financial Health Dashboard' })).toBeVisible()
    const newNetWorth = await page.locator('text=Net Worth').locator('..').locator('text=/\\$[\\d,]+/').first().textContent()
    expect(newNetWorth).toBeTruthy()
  })

  test('should display currency values correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // All currency values should use $ format
    const currencyPattern = /\$[\d,]+/
    const currencyElements = await page.locator(`text=${currencyPattern}`).all()
    
    // Should have multiple currency values displayed
    expect(currencyElements.length).toBeGreaterThan(0)
  })

  test('should display percentage values correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // Percentages should be formatted correctly
    const percentPattern = /\d+\.\d%/
    const percentElements = await page.locator(`text=${percentPattern}`).all()
    
    // Should have DTI ratio and savings rate as percentages
    expect(percentElements.length).toBeGreaterThan(0)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto(`${BASE_URL}/financial-health`, { waitUntil: 'networkidle' })

    // All cards should still be visible
    await expect(page.getByRole('heading', { name: 'Net Worth' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cash Flow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Debt-to-Income Ratio' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emergency Fund' })).toBeVisible()
  })
})

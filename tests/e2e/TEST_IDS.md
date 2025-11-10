# Test IDs Reference

This document lists all `data-testid` attributes available for E2E testing.

## Income Sources

### Buttons
- `add-income-button` - Add new income source button (appears twice: in header and empty state)
- `income-{id}-edit-button` - Edit button for specific income
- `income-{id}-delete-button` - Delete button for specific income

### Modal Form Inputs
- `income-source-input` - Income source name input
- `income-amount-input` - Income amount input
- `income-modal-submit-button` - Submit button in income modal

## Savings Accounts

### Buttons
- `add-savings-button` - Add new savings account button (appears twice: in header and empty state)
- `savings-{id}-edit-button` - Edit button for specific savings account
- `savings-{id}-delete-button` - Delete button for specific savings account

### Modal Form Inputs
- `savings-name-input` - Savings account name input
- `savings-current-balance-input` - Current balance input
- `savings-interest-rate-input` - Interest rate input
- `savings-monthly-deposit-input` - Monthly deposit input
- `savings-modal-submit-button` - Submit button in savings modal

## Loans & Debts

### Buttons
- `add-loan-button` - Add new loan button (appears twice: in header and empty state)
- `loan-{id}-edit-button` - Edit button for specific loan
- `loan-{id}-delete-button` - Delete button for specific loan

### Modal Form Inputs
- `loan-name-input` - Loan name input
- `loan-principal-input` - Original loan amount input
- `loan-interest-rate-input` - Interest rate input
- `loan-monthly-payment-input` - Monthly payment input
- `loan-modal-submit-button` - Submit button in loan modal

## Usage in Tests

```typescript
// Example: Add a new income source
await page.getByTestId("add-income-button").click();
await page.getByTestId("income-source-input").fill("Salary");
await page.getByTestId("income-amount-input").fill("5000.00");
await page.getByTestId("income-modal-submit-button").click();

// Example: Edit existing income
await page.getByTestId(`income-${testData.income.id}-edit-button`).click();
await page.getByTestId("income-amount-input").fill("5500.00");
await page.getByTestId("income-modal-submit-button").click();

// Example: Delete income
await page.getByTestId(`income-${testData.income.id}-delete-button`).click();
await page.getByRole("button", { name: /confirm|yes|delete/i }).click();
```

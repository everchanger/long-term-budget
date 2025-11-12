# Global Assumptions Test Plan

## Summary
This document outlines the expected behavior of the Global Assumptions feature and provides manual verification steps since E2E tests are encountering server connectivity issues.

## Expected Behavior

### When Global Assumptions are DISABLED (default):
1. **API Parameters**: Should send `incomeGrowth=0&expenseGrowth=0&savingsRate=0&investmentReturn=0`
2. **10-Year Projection**: Should show approximately **$1.0M** (conservative estimate)
3. **Monthly values remain flat**: Income and expenses don't grow over time
4. **Table values**: Progressive growth due to savings accumulation only, NO compound interest effects

### When Global Assumptions are ENABLED:
1. **API Parameters**: Should send actual percentage values (e.g., `incomeGrowth=3&expenseGrowth=2&savingsRate=4&investmentReturn=8`)
2. **10-Year Projection**: Should show approximately **$1.3M** (optimistic with growth)
3. **Monthly values increase**: Income grows 3%/year, expenses grow 2%/year
4. **Table values**: Compound growth effects visible

## Manual Verification Steps

### Step 1: Verify API Calls with Assumptions DISABLED

1. Open browser DevTools (F12) → Network tab
2. Navigate to `/projections`
3. Look for API call to `/api/households/[id]/projections?...`
4. **EXPECTED**: URL parameters should show:
   ```
   incomeGrowth=0
   expenseGrowth=0
   savingsRate=0
   investmentReturn=0
   ```

### Step 2: Verify Projection Values DISABLED

1. On projections page with assumptions DISABLED
2. Check "10-Year Summary" card
3. **EXPECTED** values (approximately):
   - Starting Net Worth: ~$86k
   - Ending Net Worth (10 Years): **~$1.0M**
   - Growth Rate: ~1091%
   - Avg Monthly Cash Flow: ~$7,420

### Step 3: Enable Assumptions and Verify API

1. Click the Global Assumptions toggle to ENABLE
2. Wait 1-2 seconds for debounced API call
3. Check Network tab for new API call
4. **EXPECTED**: URL parameters should show:
   ```
   incomeGrowth=3
   expenseGrowth=2
   savingsRate=4 (or 3.75, depending on slider position)
   investmentReturn=8
   ```

### Step 4: Verify Projection Values ENABLED

1. With assumptions ENABLED
2. Check "10-Year Summary" card again
3. **EXPECTED** values (approximately):
   - Starting Net Worth: ~$87k (slight difference due to initial calculations)
   - Ending Net Worth (10 Years): **~$1.3M**
   - Growth Rate: ~1435%
   - Avg Monthly Cash Flow: ~$8,705

### Step 5: Verify Data Table (DISABLED)

1. With assumptions DISABLED
2. Click "Show Table" button
3. **EXPECTED** in table:
   - Year 0: Net Worth ~$86k, Debt $28k, Income $11k, Expenses $3,580
   - Year 5: Net Worth ~$577k (steady savings accumulation)
   - Year 9: Net Worth ~$1.0M
   - **NO NaN values**
   - **NO $0 values** (except debt after year 3-4)
   - Monthly Income/Expenses **stay constant** at $11k/$3,580

### Step 6: Verify Data Table (ENABLED)

1. Enable Global Assumptions
2. Data table should update
3. **EXPECTED** differences:
   - Year 5: Net Worth **higher** than disabled (~$600k+ vs $577k)
   - Year 9: Net Worth **higher** than disabled (~$1.3M+ vs $1.0M)
   - Monthly Income/Expenses **increase over time** (not constant)

### Step 7: Verify Toggle Consistency

1. Start with DISABLED, note the 10-year projection value
2. Enable assumptions, value should increase
3. Disable again
4. **EXPECTED**: Should return to original DISABLED value

## Known Issues to Check

### Issue 1: Cached API Response
**Problem**: Browser might cache the first API response
**Solution**: Hard refresh (Ctrl+Shift+R) after each toggle change

### Issue 2: Debounce Delay
**Problem**: Changes take 500ms to trigger API call
**Solution**: Wait 1-2 seconds after toggling before checking values

### Issue 3: Server Restart
**Problem**: Dev server restarts can cause stale data
**Solution**: Restart dev server and reload page

## Code Changes Made

### 1. Backend Fix (`server/api/households/[id]/projections.get.ts`)
```typescript
// OLD (treats 0 as falsy):
const incomeGrowthRate = query.incomeGrowth
  ? parseFloat(query.incomeGrowth as string) / 100
  : 0.03;

// NEW (allows explicit 0):
const incomeGrowthRate = query.incomeGrowth !== undefined
  ? parseFloat(query.incomeGrowth as string) / 100
  : 0.03;
```

### 2. Frontend Scroll Fix (`app/pages/projections.vue`)
```typescript
// Store scroll position before update
const scrollY = window.scrollY;

// After API call, restore scroll
nextTick(() => {
  window.scrollTo(0, scrollY);
});
```

### 3. Data Table Component (`app/pages/projections.vue`)
- Added toggleable table view
- Shows years 0-9 with all financial metrics
- Color-coded positive/negative values

## Debugging Tips

If values still look wrong:

1. **Check console for errors**: Look for failed API calls
2. **Verify API response**: Check Network tab → Response for actual calculated values
3. **Check computed values**: In Vue DevTools, inspect `activeIncomeGrowth` etc.
4. **Test with network throttling**: Slow connection might cause race conditions
5. **Check database values**: Ensure test data is seeded correctly

## Expected Test Results

The E2E tests in `tests/e2e/global-assumptions.spec.ts` validate:

- ✅ Toggle shows "Disabled" by default
- ✅ Sliders hidden when disabled
- ✅ API sends 0 values when disabled
- ✅ API sends actual percentages when enabled
- ✅ Projections differ between enabled/disabled
- ✅ Table shows no NaN or unexpected $0 values
- ✅ Progressive growth visible in table data
- ✅ No scroll-to-top when adjusting sliders

Run with: `npm run test:e2e -- global-assumptions.spec.ts`

# Nuxt UI 4.2.0 Component Refactoring Plan

## Overview
This plan identifies opportunities to replace custom implementations with Nuxt UI 4.2.0 standardized components for better consistency, accessibility, and maintainability.

## Key Benefits
- **UAuthForm**: Built-in validation, field management, provider buttons, i18n support
- **USelect**: Better styling, keyboard navigation, search, icons, avatars, chips
- **UInput**: Consistent styling, validation states, icons, loading states
- **Standardization**: Consistent UI/UX across the entire application
- **Accessibility**: ARIA attributes and keyboard navigation out-of-the-box
- **Reduced Code**: Less custom CSS and component logic to maintain

## Refactoring Opportunities

### 1. 🔐 Authentication Form (HIGH PRIORITY)
**File**: `app/pages/auth.vue`

**Current State**:
- Custom form with manual field management
- Native `<input>` elements with custom styling
- Manual validation logic
- Custom error handling
- ~218 lines of code

**Target State**: Use `UAuthForm`
- Automatic field validation with Zod schemas
- Built-in loading states
- Proper i18n integration
- Validation error display
- Provider buttons support (for future OAuth)
- ~60-80 lines of code (estimated)

**Benefits**:
- Automatic form state management
- Built-in validation UI
- Consistent error messages
- Support for adding OAuth providers later
- Better accessibility

**Implementation Notes**:
```vue
<!-- Before -->
<input
  v-model="email"
  type="email"
  class="w-full px-3 py-2 border..."
/>

<!-- After -->
<UAuthForm
  :fields="[
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'password', type: 'password', label: 'Password', required: true },
    { name: 'name', type: 'text', label: 'Name' }
  ]"
  :schema="authSchema"
  @submit="handleSubmit"
/>
```

**Estimated Effort**: 2-3 hours
**Code Reduction**: ~60%

---

### 2. 📋 Select Elements (HIGH PRIORITY)
**Files**: 
- `app/pages/settings.vue` (language & currency selects)
- `app/components/IncomeSourceModal.vue` (frequency select)
- `app/components/LoanModal.vue` (frequency select)
- `app/components/SavingsAccountModal.vue` (frequency select)
- `app/components/BudgetExpenseModal.vue` (category/frequency selects)

**Current State**:
- Native `<select>` elements with custom styling
- Inconsistent appearance across browsers
- Poor mobile UX
- No search functionality
- Custom CSS classes

**Target State**: Use `USelect`
- Modern dropdown UI with animations
- Search/filter capability
- Icons and avatars support
- Keyboard navigation
- Consistent styling across all platforms
- Better mobile experience

**Benefits**:
- Professional appearance matching modern UI standards
- Better UX with search and keyboard navigation
- Consistent with the rest of Nuxt UI components
- Support for icons, avatars, and chips
- Proper focus states and accessibility

**Implementation Notes**:
```vue
<!-- Before -->
<select
  v-model="selectedLanguage"
  class="w-full px-3 py-2 border border-gray-300..."
>
  <option value="en">English</option>
  <option value="sv">Svenska</option>
</select>

<!-- After -->
<USelect
  v-model="selectedLanguage"
  :items="[
    { label: 'English', value: 'en', icon: 'i-lucide-flag' },
    { label: 'Svenska', value: 'sv', icon: 'i-lucide-flag' }
  ]"
  placeholder="Select language"
/>
```

**Example with Icons (Frequency)**:
```vue
<USelect
  v-model="formState.frequency"
  :items="[
    { label: 'Monthly', value: 'monthly', icon: 'i-lucide-calendar' },
    { label: 'Yearly', value: 'yearly', icon: 'i-lucide-calendar-days' },
    { label: 'Weekly', value: 'weekly', icon: 'i-lucide-clock' },
    { label: 'Bi-weekly', value: 'bi-weekly', icon: 'i-lucide-clock' }
  ]"
  placeholder="Select frequency"
/>
```

**Estimated Effort**: 1-2 hours
**Affected Files**: 5+ files
**Code Reduction**: ~30%

---

### 3. 📝 Input Fields (MEDIUM PRIORITY)
**Files**: All `*Modal.vue` components
- `IncomeSourceModal.vue`
- `LoanModal.vue`
- `SavingsAccountModal.vue`
- `SavingsGoalModal.vue`
- `BudgetExpenseModal.vue`
- `EditPersonModal.vue`

**Current State**:
- Native `<input>` elements with custom classes
- Manual validation styling
- Inconsistent appearance
- No built-in icons or loading states

**Target State**: Use `UInput`
- Consistent styling
- Built-in validation states (highlight prop)
- Icon support (leading/trailing)
- Loading states
- Better accessibility

**Benefits**:
- Consistent input styling across all forms
- Built-in error/success states
- Support for icons (e.g., currency symbol, percentage)
- Loading indicators for async operations
- Better focus states

**Implementation Notes**:
```vue
<!-- Before -->
<input
  v-model="formState.name"
  type="text"
  placeholder="Name"
  class="w-full px-3 py-2 border border-gray-300..."
/>

<!-- After -->
<UInput
  v-model="formState.name"
  type="text"
  placeholder="Name"
  icon="i-lucide-user"
/>

<!-- Number input with currency icon -->
<UInput
  v-model="formState.amount"
  type="number"
  placeholder="0.00"
  icon="i-lucide-dollar-sign"
  trailing-icon="i-lucide-info"
/>

<!-- Percentage input -->
<UInput
  v-model="formState.interestRate"
  type="number"
  placeholder="0.00"
  trailing="%"
/>
```

**Estimated Effort**: 2-3 hours
**Affected Files**: 6+ modal components
**Code Reduction**: ~25%

---

### 4. 🔔 Form Validation UI (NEW OPPORTUNITY)
**Context**: Currently using manual error display

**Opportunity**: Use `UFormField` wrapper
- Automatic label/error/hint management
- Consistent validation UI
- Better accessibility with proper ARIA attributes

**Implementation Notes**:
```vue
<!-- Wrap inputs with UFormField -->
<UFormField
  :label="$t('income.name')"
  :error="errors.name"
  :hint="$t('income.nameHint')"
  required
>
  <UInput
    v-model="formState.name"
    placeholder="Salary"
  />
</UFormField>
```

**Estimated Effort**: 1-2 hours (can be combined with UInput refactor)

---

### 5. 🎨 Card Components (LOW PRIORITY)
**Context**: Already using UCard extensively

**Opportunity**: Review for consistent slot usage
- Ensure proper use of `#header`, `#body`, `#footer` slots
- Check for custom padding that could use card slots
- Verify consistent styling

**Files to Review**:
- `app/pages/settings.vue`
- `app/pages/auth.vue`
- All page components using UCard

**Estimated Effort**: 30 minutes - 1 hour

---

## Implementation Order

### Phase 1: High Impact, User-Facing (Priority 1)
1. **Settings Page Selects** (30 min)
   - Replace language select with USelect
   - Replace currency select with USelect
   - Update tests

2. **Modal Selects** (1 hour)
   - Replace all frequency selects in modals
   - Add icons to frequency options
   - Ensure consistent appearance

3. **Auth Page** (2-3 hours)
   - Implement UAuthForm
   - Setup Zod validation schemas
   - Update i18n keys if needed
   - Update auth tests

### Phase 2: Form Consistency (Priority 2)
4. **Modal Inputs** (2-3 hours)
   - Replace all `<input>` with `UInput`
   - Add appropriate icons (currency, percentage, etc.)
   - Wrap with UFormField for validation
   - Update modal tests

### Phase 3: Polish (Priority 3)
5. **Card Review** (1 hour)
   - Review all UCard usages
   - Ensure consistent slot usage
   - Remove redundant custom styling

6. **E2E Tests** (1-2 hours)
   - Update all test selectors
   - Verify form submissions work
   - Check validation displays
   - Test mobile menu

### Phase 4: Validation
7. **Build & Test** (1 hour)
   - Run full build
   - Execute e2e test suite
   - Manual testing of all forms
   - Cross-browser testing

---

## Technical Considerations

### USelect Implementation
```typescript
// Type-safe select items
import type { SelectItem } from '@nuxt/ui'

const languageOptions: SelectItem[] = [
  { label: 'English', value: 'en', icon: 'i-lucide-flag' },
  { label: 'Svenska', value: 'sv', icon: 'i-lucide-flag' }
]
```

### UAuthForm with Zod
```typescript
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

const authSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required').optional()
})

type AuthSchema = z.output<typeof authSchema>

const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'password', type: 'password', label: 'Password', required: true },
  { name: 'name', type: 'text', label: 'Name' }
]

function onSubmit(event: FormSubmitEvent<AuthSchema>) {
  // event.data is typed!
  console.log(event.data.email, event.data.password)
}
```

### UInput with Icons
```vue
<!-- Currency input -->
<UInput
  v-model="amount"
  type="number"
  icon="i-lucide-dollar-sign"
  placeholder="0.00"
/>

<!-- Percentage input -->
<UInput
  v-model="rate"
  type="number"
  trailing="%"
  placeholder="0.00"
/>

<!-- With validation state -->
<UInput
  v-model="email"
  type="email"
  :highlight="!!errors.email"
  color="error"
/>
```

---

## Testing Strategy

### Unit Tests
- Test USelect v-model bindings
- Test UAuthForm validation
- Test UInput value formatting

### E2E Tests
- Update selectors for USelect (use role="combobox")
- Update selectors for UAuthForm fields
- Test form submissions with new components
- Verify validation error displays

### Manual Testing
- Test all select dropdowns on mobile
- Verify keyboard navigation works
- Check tab order in forms
- Test with screen readers
- Verify theme switching (dark mode)

---

## Rollback Plan

If issues arise:
1. All changes in feature branch
2. Each phase in separate commits
3. Can cherry-pick successful changes
4. Original components backed up in git history

---

## Success Metrics

- ✅ All native `<select>` elements replaced with USelect
- ✅ Auth form using UAuthForm (60% code reduction)
- ✅ All native `<input>` elements replaced with UInput
- ✅ Consistent validation UI across all forms
- ✅ All e2e tests passing
- ✅ Build successful with no TypeScript errors
- ✅ Better user experience on mobile devices
- ✅ Improved accessibility scores

---

## Timeline Estimate

**Total Estimated Time**: 8-12 hours

| Phase | Task | Time |
|-------|------|------|
| 1 | Settings selects | 30m |
| 1 | Modal selects | 1h |
| 1 | Auth form | 2-3h |
| 2 | Modal inputs | 2-3h |
| 3 | Card review | 1h |
| 3 | E2E tests | 1-2h |
| 4 | Build & validate | 1h |

---

## Next Steps

1. **Get approval** for the refactoring plan
2. **Start with Phase 1** (high-impact, user-facing changes)
3. **Iterate through phases** systematically
4. **Update tests** as we go
5. **Document any issues** or learnings
6. **Final validation** with full test suite

---

## Questions to Resolve

1. Should we add OAuth providers to UAuthForm now or later?
2. Do we want icons on all select options or just some?
3. Should frequency selects have calendar/clock icons?
4. Any custom styling overrides needed for brand consistency?

---

## References

- [UAuthForm Documentation](https://ui.nuxt.com/docs/components/auth-form)
- [USelect Documentation](https://ui.nuxt.com/docs/components/select)
- [UInput Documentation](https://ui.nuxt.com/docs/components/input)
- [UFormField Documentation](https://ui.nuxt.com/docs/components/form-field)
- [Lucide Icons](https://lucide.dev/) (i-lucide-*)

---

**Created**: November 19, 2025
**Last Updated**: November 19, 2025
**Status**: Ready for Implementation

# Layout Components Refactor Plan

## Overview
Improve UI consistency by utilizing Nuxt UI 4.2.0 layout components and standardizing wrapper patterns throughout the application.

## Goals
1. Replace manual theme toggle with `UColorSwitch` component
2. Standardize page layouts using `UPage`, `UPageHeader`, `UPageBody`
3. Replace manual div wrappers with semantic Nuxt UI components
4. Use `UDivider` instead of border utility classes
5. Maintain consistent spacing and responsive behavior

## Current Issues
- Manual theme toggle implementation with separate sun/moon buttons
- Inconsistent page header patterns across pages
- Too many custom div wrappers with manual spacing/styling
- Border classes duplicated across components

## Implementation Phases

### Phase 1: Add UColorSwitch to Layout ✓
**Files:**
- `/app/layouts/default.vue` - Replace manual theme toggle buttons

**Benefits:**
- Automatic theme switching with single component
- Built-in animations and accessibility
- Reduces code by ~15 lines

### Phase 2: Standardize Settings Page Layout
**Files:**
- `/app/pages/settings.vue`

**Changes:**
- Remove outer wrapper divs
- Use `UPageHeader` for title/description
- Use `UPageBody` for content
- Add `UColorSwitch` as a settings option
- Use `UDivider` between sections

**Benefits:**
- Consistent with other pages
- Semantic HTML structure
- Theme toggle visible in settings

### Phase 3: Refactor Dashboard Layout
**Files:**
- `/app/pages/dashboard.vue`

**Changes:**
- Replace header div with `UPageHeader`
- Move actions to header's `trailing` slot
- Simplify card structure

### Phase 4: Refactor Economy Page Layout
**Files:**
- `/app/pages/economy.vue`

**Changes:**
- Use `UPageHeader` for page title
- Convert Financial Story CTA to `UAlert` with proper styling
- Use `UDivider` between sections

### Phase 5: Refactor Other Pages
**Files:**
- `/app/pages/projections.vue`
- `/app/pages/scenarios.vue`
- `/app/pages/financial-health.vue`

**Changes:**
- Standardize all page layouts
- Use consistent header patterns
- Replace border divs with `UDivider`

### Phase 6: Component Cleanup
**Files:**
- All modal components
- Card components

**Changes:**
- Replace `border-t` divs with `UDivider`
- Ensure consistent use of UCard sections
- Clean up space-y classes where UFormField handles spacing

## Components to Use

### UColorSwitch
```vue
<UColorSwitch />
```
- Automatic theme toggle
- Built-in icons and animations

### UPage, UPageHeader, UPageBody
```vue
<UPage>
  <UPageHeader
    title="Page Title"
    description="Page description"
  >
    <template #trailing>
      <!-- Action buttons -->
    </template>
  </UPageHeader>

  <UPageBody>
    <!-- Page content -->
  </UPageBody>
</UPage>
```

### UDivider
```vue
<UDivider />
```
- Replaces `<div class="border-t border-gray-200 dark:border-gray-700" />`
- Semantic and consistent

### UContainer
```vue
<UContainer>
  <!-- Content with automatic responsive padding -->
</UContainer>
```

## Expected Outcomes

### Code Quality
- **20-30% reduction** in template code
- More semantic HTML structure
- Better accessibility

### Consistency
- Uniform page headers across all pages
- Consistent spacing patterns
- Predictable component behavior

### Maintainability
- Easier to update global styling
- Less custom CSS to manage
- Clear component hierarchy

## Migration Strategy

1. **Phase 1**: Quick win - Add UColorSwitch (5 min)
2. **Phase 2-4**: Update main pages one at a time (30 min)
3. **Phase 5**: Update remaining pages (20 min)
4. **Phase 6**: Component cleanup (15 min)
5. **Testing**: Visual review and E2E tests (15 min)

**Total estimated time: ~90 minutes**

## Notes

- Preserve all existing functionality
- Maintain data-testid attributes for tests
- Keep current responsive behavior
- Update E2E tests if selectors change

## Success Criteria

- [ ] UColorSwitch working in header
- [ ] All pages use UPageHeader/UPageBody
- [ ] No manual border-t dividers (use UDivider)
- [ ] Consistent spacing across pages
- [ ] Build passes without errors
- [ ] Visual review confirms UI consistency

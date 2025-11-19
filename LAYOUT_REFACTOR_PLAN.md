# Layout Refactor Plan - Nuxt UI 4.2.0

## Overview
This document outlines the plan to refactor the application layout to use the standardized layout components provided by Nuxt UI 4.2.0. This will improve consistency, reduce custom code, and align with Nuxt UI best practices.

## Goals
1. ✅ Upgrade from `@nuxt/ui` 3.3.2 to 4.2.0
2. 🔄 Replace custom layout implementation with Nuxt UI layout components
3. 🔄 Standardize page structure using `UContainer`
4. 🔄 Implement `UHeader` for consistent navigation
5. 🔄 Add `UMain` for proper content area handling
6. 🔄 Implement `UFooter` for consistent footer
7. 🔄 Update all pages to use the new layout structure
8. 🔄 Update e2e tests to match new component structure

## Current State Analysis

### Current Structure
```
app.vue
├── UApp (wrapper)
└── NuxtLayout
    └── NuxtPage

layouts/default.vue
├── Custom header (<header> with manual styling)
│   ├── Logo and brand
│   ├── Manual UNavigationMenu
│   ├── Auth controls
│   ├── Theme toggle
│   └── Mobile menu (custom implementation)
├── Custom main (<main> with manual constraints)
└── Custom footer (<footer> with manual styling)
```

### Issues with Current Implementation
1. **Custom header implementation** - Not using `UHeader` component
2. **Manual mobile menu** - Custom state management and toggle logic
3. **Inconsistent spacing** - Manual `max-w-7xl` and padding throughout
4. **No UContainer** - Pages define their own width constraints
5. **Custom footer** - Not using `UFooter` component
6. **Duplicate layout logic** - Some pages have their own wrapper divs

## Target State

### New Structure
```
app.vue
└── UApp (with global config)
    ├── UHeader (standardized header)
    │   ├── #title slot (logo)
    │   ├── UNavigationMenu (center)
    │   ├── #right slot (auth controls, theme, etc.)
    │   └── #body slot (mobile menu content)
    ├── UMain (automatic height management)
    │   └── NuxtLayout
    │       └── NuxtPage
    └── UFooter (standardized footer)

layouts/default.vue
└── UContainer
    └── <slot /> (page content)

pages/*.vue
└── Page content (no wrapper needed)
```

## Implementation Steps

### Phase 1: Upgrade Dependencies ✅
- [x] Update `@nuxt/ui` from 3.3.2 to 4.2.0 in package.json
- [ ] Run `npm install` to upgrade
- [ ] Test that the app still runs

### Phase 2: Refactor app.vue (HIGH PRIORITY)
**File:** `/app/app.vue`

**Current:**
```vue
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

**Target:**
```vue
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuth()
const session = ref(null)
const isSigningOut = ref(false)
const route = useRoute()
const { t } = useI18n()

// Get session
const updateSession = async () => {
  if (import.meta.client) {
    try {
      const sessionData = await auth.getSession()
      session.value = sessionData.data
    } catch {
      session.value = null
    }
  }
}

onMounted(updateSession)

// Handle sign out
const handleSignOut = async () => {
  try {
    isSigningOut.value = true
    await auth.signOut()
    session.value = null
    await navigateTo('/auth')
  } catch (error) {
    console.error('Sign out error:', error)
  } finally {
    isSigningOut.value = false
  }
}

// Navigation items
const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t('navigation.home'),
    to: '/economy',
    active: route.path === '/economy'
  },
  {
    label: t('navigation.projections'),
    to: '/projections',
    active: route.path.startsWith('/projections')
  }
])

// Watch route changes to update session
watch(() => route.path, updateSession)
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-chart-bar"
            class="text-2xl text-blue-600 dark:text-blue-400"
          />
          <span class="font-bold text-xl">{{ $t('common.appName') }}</span>
        </NuxtLink>
      </template>

      <!-- Desktop navigation -->
      <UNavigationMenu v-if="session" :items="navItems" />

      <template #right>
        <!-- Auth controls when logged in -->
        <template v-if="session">
          <span class="hidden md:block text-sm text-muted">
            {{ session.user.name }}
          </span>
          <UButton
            variant="ghost"
            icon="i-heroicons-cog-6-tooth"
            to="/settings"
            :title="$t('navigation.settings')"
            :aria-label="$t('navigation.settings')"
          />
          <UButton
            variant="ghost"
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="isSigningOut"
            :title="$t('auth.signOut')"
            :aria-label="$t('auth.signOut')"
            @click="handleSignOut"
          />
        </template>
        
        <!-- Sign in button when logged out -->
        <UButton
          v-else
          variant="solid"
          color="primary"
          @click="navigateTo('/auth')"
        >
          {{ $t('auth.signIn') }}
        </UButton>

        <!-- Theme toggle -->
        <UColorModeButton />
      </template>

      <!-- Mobile menu body -->
      <template #body>
        <UNavigationMenu
          v-if="session"
          :items="navItems"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © 2025 {{ $t('common.appName') }}
        </p>
      </template>

      <template #right>
        <div class="flex gap-4 text-sm">
          <NuxtLink to="#" class="text-muted hover:text-default transition-colors">
            Privacy
          </NuxtLink>
          <NuxtLink to="#" class="text-muted hover:text-default transition-colors">
            Terms
          </NuxtLink>
          <NuxtLink to="#" class="text-muted hover:text-default transition-colors">
            Support
          </NuxtLink>
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
```

**Changes:**
- Move all header/footer logic from `layouts/default.vue` to `app.vue`
- Use `UHeader` with proper slots
- Use `UNavigationMenu` with `items` prop (not `links`)
- Use `UMain` for automatic height management
- Use `UFooter` for standardized footer
- Use `UColorModeButton` instead of manual theme toggle
- Simplify mobile menu using `#body` slot

### Phase 3: Simplify layouts/default.vue (HIGH PRIORITY)
**File:** `/app/layouts/default.vue`

**Current:** 284 lines with custom header, footer, mobile menu

**Target:**
```vue
<template>
  <UContainer>
    <slot />
  </UContainer>
</template>
```

**Changes:**
- Remove all custom header/footer/mobile menu code
- Use `UContainer` to center and constrain width
- Layout becomes a simple wrapper

### Phase 4: Update Pages (MEDIUM PRIORITY)
Remove redundant wrapper divs and manual width constraints from pages.

**Pattern to follow:**

**Before (e.g., economy.vue):**
```vue
<template>
  <div>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- content -->
      </div>
    </div>
  </div>
</template>
```

**After:**
```vue
<template>
  <div class="py-8">
    <!-- content -->
  </div>
</template>
```

**Pages to update:**
- [ ] `/app/pages/economy.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/projections.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/scenarios.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/financial-health.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/financial-story.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/settings.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/dashboard.vue` - Remove max-w-7xl wrapper
- [ ] `/app/pages/auth.vue` - May need special layout (no UContainer)
- [ ] `/app/pages/index.vue` - May need special layout (landing page)

### Phase 5: Create Auth Layout (MEDIUM PRIORITY)
**File:** `/app/layouts/auth.vue` (new file)

For pages like auth and index that don't need the container constraint:

```vue
<template>
  <slot />
</template>
```

Then in auth.vue and index.vue:
```vue
<script setup>
definePageMeta({
  layout: 'auth'
})
</script>
```

### Phase 6: Update E2E Tests (HIGH PRIORITY)
**File:** `/tests/e2e/auth-routing.spec.ts`

**Changes needed:**
- Update selectors to find UHeader component elements
- Update navbar visibility tests for new structure
- Update active state tests for UNavigationMenu items
- Test mobile menu drawer/modal behavior

**Key selector changes:**
```typescript
// Old: page.locator('header')
// New: page.locator('[data-slot="header"]') or page.getByRole('banner')

// Old: Custom mobile menu toggle
// New: UHeader toggle button

// Old: Custom nav links
// New: UNavigationMenu items with aria-current="page" for active state
```

### Phase 7: CSS Variables Configuration (LOW PRIORITY)
**File:** `/app.config.ts`

Add configuration for CSS variables:

```typescript
export default defineAppConfig({
  ui: {
    // Header height customization if needed
    header: {
      slots: {
        root: 'bg-default/75 backdrop-blur border-b border-default h-(--ui-header-height) sticky top-0 z-50'
      }
    },
    // Container max-width customization if needed
    container: {
      base: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    }
  }
})
```

## Benefits of New Approach

### 1. Standardization
- Using official Nuxt UI components
- Consistent behavior across the app
- Easier to maintain and update

### 2. Less Custom Code
- **Before:** 284 lines in layouts/default.vue
- **After:** ~3 lines in layouts/default.vue
- Mobile menu handled by UHeader automatically

### 3. Better Mobile UX
- UHeader provides modal/drawer/slideover modes
- Automatic responsive behavior
- Built-in accessibility features

### 4. Automatic Height Management
- UMain automatically fills available viewport height
- No manual flex layout needed
- Works with sticky header and footer

### 5. Theme Integration
- UColorModeButton handles theme switching
- Consistent with Nuxt UI design system
- Better dark mode support

### 6. Navigation State
- UNavigationMenu handles active states via `active` property
- Aria attributes automatically applied
- Better keyboard navigation

## Migration Checklist

### Pre-Migration
- [x] Document current layout structure
- [x] Create refactor plan
- [ ] Review all page layouts
- [ ] Identify special layout needs (auth, landing)

### Migration
- [ ] **Step 1:** Run `npm install` to upgrade to Nuxt UI 4.2.0
- [ ] **Step 2:** Test app still runs with new version
- [ ] **Step 3:** Refactor `app.vue` with UHeader/UMain/UFooter
- [ ] **Step 4:** Simplify `layouts/default.vue` to use UContainer
- [ ] **Step 5:** Create `layouts/auth.vue` for special pages
- [ ] **Step 6:** Update all pages to remove wrapper divs
- [ ] **Step 7:** Update e2e tests for new structure
- [ ] **Step 8:** Configure CSS variables if needed

### Post-Migration Testing
- [ ] Visual regression testing on all pages
- [ ] Mobile menu functionality testing
- [ ] Theme switching testing
- [ ] Navigation active state testing
- [ ] Run full e2e test suite
- [ ] Test on different screen sizes
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

## Rollback Plan

If issues arise:
1. Keep the old layout in a backup file: `layouts/default.vue.backup`
2. Git commit after each phase
3. Can revert to previous Nuxt UI version in package.json
4. Test thoroughly in development before deploying

## Timeline Estimate

- **Phase 1 (Upgrade):** 10 minutes
- **Phase 2 (app.vue refactor):** 1 hour
- **Phase 3 (layouts refactor):** 30 minutes
- **Phase 4 (pages update):** 2 hours
- **Phase 5 (auth layout):** 30 minutes
- **Phase 6 (tests update):** 1.5 hours
- **Phase 7 (CSS config):** 30 minutes
- **Testing:** 1 hour

**Total estimated time:** ~7 hours

## References

- [UApp Component](https://ui.nuxt.com/docs/components/app)
- [UHeader Component](https://ui.nuxt.com/docs/components/header)
- [UMain Component](https://ui.nuxt.com/docs/components/main)
- [UFooter Component](https://ui.nuxt.com/docs/components/footer)
- [UContainer Component](https://ui.nuxt.com/docs/components/container)
- [UNavigationMenu Component](https://ui.nuxt.com/docs/components/navigation-menu)
- [UColorModeButton Component](https://ui.nuxt.com/docs/components/color-mode-button)

## Notes

- The `UNavigationMenu` uses `items` prop (not `links`)
- Navigation items use `active` property for highlighting (not manual color prop)
- UHeader provides built-in mobile menu with modal/drawer/slideover modes
- UMain automatically calculates height based on header/footer
- UContainer respects `--ui-container` CSS variable for max-width
- All components support dark mode automatically

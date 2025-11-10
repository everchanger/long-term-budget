export const BUDGET_EXPENSE_CATEGORIES = [
  {
    value: "housing",
    label: "Housing",
    icon: "i-heroicons-home",
    description: "Rent, mortgage, property tax",
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: "i-heroicons-bolt",
    description: "Electric, water, gas, internet",
  },
  {
    value: "transportation",
    label: "Transportation",
    icon: "i-heroicons-truck",
    description: "Car payment, gas, insurance, transit",
  },
  {
    value: "food",
    label: "Food & Groceries",
    icon: "i-heroicons-shopping-cart",
    description: "Groceries, dining out",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    icon: "i-heroicons-heart",
    description: "Insurance, medications, doctor visits",
  },
  {
    value: "insurance",
    label: "Insurance",
    icon: "i-heroicons-shield-check",
    description: "Life, health, home, auto insurance",
  },
  {
    value: "debt",
    label: "Debt Payments",
    icon: "i-heroicons-credit-card",
    description: "Credit cards, loans, other debt",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: "i-heroicons-film",
    description: "Streaming, hobbies, subscriptions",
  },
  {
    value: "personal",
    label: "Personal Care",
    icon: "i-heroicons-sparkles",
    description: "Haircuts, gym, clothing",
  },
  {
    value: "other",
    label: "Other",
    icon: "i-heroicons-ellipsis-horizontal-circle",
    description: "Miscellaneous expenses",
  },
] as const;

export type BudgetExpenseCategoryValue =
  (typeof BUDGET_EXPENSE_CATEGORIES)[number]["value"];

export function getCategoryInfo(category: string) {
  return (
    BUDGET_EXPENSE_CATEGORIES.find((c) => c.value === category) ||
    BUDGET_EXPENSE_CATEGORIES.find((c) => c.value === "other")!
  );
}

export function getCategoryIcon(category: string): string {
  return getCategoryInfo(category).icon;
}

export function getCategoryLabel(category: string): string {
  return getCategoryInfo(category).label;
}

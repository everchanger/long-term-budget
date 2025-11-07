import { z } from "zod";

/**
 * Shared Zod validation utilities for common patterns.
 * These helpers provide consistent validation and error messages across all schemas.
 */

/**
 * Validates a string as a decimal number with optional min/max constraints.
 * Used for financial amounts, balances, rates, etc.
 *
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive), undefined for no max
 * @returns Zod schema for validating decimal strings
 *
 * @example
 * const amount = decimalString(0); // Any positive number
 * const percentage = decimalString(0, 100); // Between 0 and 100
 */
export function decimalString(min = 0, max?: number) {
  return z.string().refine(
    (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return false;
      if (num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    },
    {
      message:
        max !== undefined
          ? `Must be a valid number between ${min} and ${max}`
          : `Must be a valid number of at least ${min}`,
    }
  );
}

/**
 * Validates a string as a percentage (0-100).
 * Convenience wrapper around decimalString for percentage fields.
 *
 * @returns Zod schema for validating percentage strings
 *
 * @example
 * const interestRate = percentageString(); // 0-100%
 */
export function percentageString() {
  return decimalString(0, 100);
}

/**
 * Validates a string as a positive decimal number (>= 0).
 * Most common case for financial amounts.
 *
 * @returns Zod schema for validating positive decimal strings
 *
 * @example
 * const amount = positiveDecimalString();
 */
export function positiveDecimalString() {
  return decimalString(0);
}

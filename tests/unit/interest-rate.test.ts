import { describe, it, expect } from "vitest";
import {
  percentageToDecimal,
  decimalToPercentage,
  convertInterestRateForDisplay,
} from "../../server/utils/interest-rate";

describe("Interest Rate Conversion Utilities", () => {
  describe("percentageToDecimal", () => {
    it("should convert percentage to decimal (number input)", () => {
      expect(percentageToDecimal(5.5)).toBe("0.055");
      expect(percentageToDecimal(10)).toBe("0.1");
      expect(percentageToDecimal(0.5)).toBe("0.005");
      expect(percentageToDecimal(100)).toBe("1");
    });

    it("should convert percentage to decimal (string input)", () => {
      expect(percentageToDecimal("5.5")).toBe("0.055");
      expect(percentageToDecimal("10")).toBe("0.1");
      expect(percentageToDecimal("0.5")).toBe("0.005");
      expect(percentageToDecimal("100")).toBe("1");
    });

    it("should handle zero", () => {
      expect(percentageToDecimal(0)).toBe("0");
      expect(percentageToDecimal("0")).toBe("0");
    });

    it("should handle very small percentages", () => {
      expect(percentageToDecimal(0.01)).toBe("0.0001");
      expect(percentageToDecimal("0.01")).toBe("0.0001");
    });

    it("should handle very large percentages", () => {
      expect(percentageToDecimal(500)).toBe("5");
      expect(percentageToDecimal("500")).toBe("5");
    });
  });

  describe("decimalToPercentage", () => {
    it("should convert decimal to percentage (number input)", () => {
      expect(decimalToPercentage(0.055)).toBe("5.5");
      expect(decimalToPercentage(0.1)).toBe("10");
      expect(decimalToPercentage(0.005)).toBe("0.5");
      expect(decimalToPercentage(1)).toBe("100");
    });

    it("should convert decimal to percentage (string input)", () => {
      expect(decimalToPercentage("0.055")).toBe("5.5");
      expect(decimalToPercentage("0.1")).toBe("10");
      expect(decimalToPercentage("0.005")).toBe("0.5");
      expect(decimalToPercentage("1")).toBe("100");
    });

    it("should handle null input", () => {
      expect(decimalToPercentage(null)).toBe(null);
    });

    it("should handle zero", () => {
      expect(decimalToPercentage(0)).toBe("0");
      expect(decimalToPercentage("0")).toBe("0");
    });

    it("should round to 2 decimal places", () => {
      // Test floating-point precision issues
      expect(decimalToPercentage(0.055555)).toBe("5.56");
      expect(decimalToPercentage(0.054444)).toBe("5.44");
      expect(decimalToPercentage("0.055555")).toBe("5.56");
    });

    it("should handle very small decimals", () => {
      expect(decimalToPercentage(0.0001)).toBe("0.01");
      expect(decimalToPercentage("0.0001")).toBe("0.01");
    });

    it("should handle very large decimals", () => {
      expect(decimalToPercentage(5)).toBe("500");
      expect(decimalToPercentage("5")).toBe("500");
    });
  });

  describe("convertInterestRateForDisplay", () => {
    it("should convert interestRate field from decimal to percentage", () => {
      const input = { id: 1, name: "Test", interestRate: "0.055" };
      const result = convertInterestRateForDisplay(input);
      expect(result.interestRate).toBe("5.5");
      expect(result.id).toBe(1);
      expect(result.name).toBe("Test");
    });

    it("should handle null interestRate", () => {
      const input = { id: 1, name: "Test", interestRate: null };
      const result = convertInterestRateForDisplay(input);
      expect(result.interestRate).toBe(null);
    });

    it("should not mutate original object", () => {
      const input = { id: 1, name: "Test", interestRate: "0.055" };
      const result = convertInterestRateForDisplay(input);
      expect(input.interestRate).toBe("0.055"); // Original unchanged
      expect(result.interestRate).toBe("5.5"); // Result converted
    });

    it("should preserve all other fields", () => {
      const input = {
        id: 1,
        name: "Test",
        balance: "1000",
        accountType: "savings",
        interestRate: "0.055",
        createdAt: new Date(),
      };
      const result = convertInterestRateForDisplay(input);
      expect(result.id).toBe(input.id);
      expect(result.name).toBe(input.name);
      expect(result.balance).toBe(input.balance);
      expect(result.accountType).toBe(input.accountType);
      expect(result.createdAt).toBe(input.createdAt);
      expect(result.interestRate).toBe("5.5");
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain precision through percentage -> decimal -> percentage", () => {
      const original = "5.5";
      const decimal = percentageToDecimal(original);
      const backToPercentage = decimalToPercentage(decimal);
      expect(backToPercentage).toBe(original);
    });

    it("should handle common interest rates", () => {
      const commonRates = ["0.5", "1", "2.5", "3.75", "5", "10", "15"];
      commonRates.forEach((rate) => {
        const decimal = percentageToDecimal(rate);
        const backToPercentage = decimalToPercentage(decimal);
        expect(backToPercentage).toBe(rate);
      });
    });
  });
});

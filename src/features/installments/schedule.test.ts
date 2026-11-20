import { describe, expect, it } from "vitest";

import { cartTotals, demoCart } from "../cart/cart";
import { getPlan, isEligible, plans } from "./plans";
import { buildSchedule, formatSAR } from "./schedule";

const start = new Date(2026, 0, 31); // 31 Jan 2026

describe("buildSchedule", () => {
  it.each(plans.map((plan) => [plan.id, plan] as const))(
    "%s: installments always add up exactly to the total",
    (_, plan) => {
      for (const amount of [100_00, 333_33, 1_999_99, 4_999_99, 12_345_67]) {
        const schedule = buildSchedule(amount, plan, start);
        const sum = schedule.installments.reduce((acc, i) => acc + i.amount, 0);
        expect(sum).toBe(schedule.total);
        expect(schedule.installments).toHaveLength(plan.count);
      }
    },
  );

  it("puts the rounding remainder on the first payment", () => {
    const { installments } = buildSchedule(100_01, getPlan("pay-in-4"), start);
    expect(installments.map((i) => i.amount)).toEqual([25_01, 25_00, 25_00, 25_00]);
  });

  it("adds a flat profit for monthly plans", () => {
    const schedule = buildSchedule(1_000_00, getPlan("6-months"), start);
    expect(schedule.profit).toBe(50_00);
    expect(schedule.total).toBe(1_050_00);
    expect(schedule.installments[1].amount).toBe(175_00);
  });

  it("charges nothing extra for Pay in 4", () => {
    expect(buildSchedule(400_00, getPlan("pay-in-4"), start).profit).toBe(0);
  });

  it("spaces due dates by the plan interval, starting today", () => {
    const dates = buildSchedule(400_00, getPlan("pay-in-4"), start).installments.map(
      (i) => i.dueDate,
    );
    expect(dates).toEqual(["2026-01-31", "2026-02-14", "2026-02-28", "2026-03-14"]);
  });

  it("rejects invalid amounts", () => {
    expect(() => buildSchedule(0, getPlan("pay-in-4"))).toThrow(RangeError);
    expect(() => buildSchedule(10.5, getPlan("pay-in-4"))).toThrow(RangeError);
  });
});

describe("plan eligibility", () => {
  it("respects each plan's min and max order value", () => {
    const payIn4 = getPlan("pay-in-4");
    expect(isEligible(payIn4, 5_000_00)).toBe(true);
    expect(isEligible(payIn4, 5_000_01)).toBe(false);
    expect(isEligible(getPlan("12-months"), 1_499_99)).toBe(false);
  });
});

describe("cart & formatting", () => {
  it("adds 15% VAT to the subtotal", () => {
    const totals = cartTotals(demoCart);
    expect(totals.subtotal).toBe(4_907_00);
    expect(totals.vat).toBe(736_05);
    expect(totals.total).toBe(5_643_05);
  });

  it("formats halalas as SAR", () => {
    expect(formatSAR(5_643_05)).toMatch(/5,643\.05/);
  });
});

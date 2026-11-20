export type PlanId = "pay-in-4" | "6-months" | "12-months";

export interface InstallmentPlan {
  id: PlanId;
  label: string;
  /** Number of payments, including the one paid at checkout. */
  count: number;
  /** Days between payments. */
  intervalDays: number;
  /** Flat profit rate applied once to the order total (e.g. 0.05 = 5%). */
  profitRate: number;
  /** Eligible order range, in halalas (1 SAR = 100 halalas). */
  minAmount: number;
  maxAmount: number;
}

export const plans: InstallmentPlan[] = [
  {
    id: "pay-in-4",
    label: "Pay in 4",
    count: 4,
    intervalDays: 14,
    profitRate: 0,
    minAmount: 100_00,
    maxAmount: 5_000_00,
  },
  {
    id: "6-months",
    label: "6 monthly payments",
    count: 6,
    intervalDays: 30,
    profitRate: 0.05,
    minAmount: 500_00,
    maxAmount: 20_000_00,
  },
  {
    id: "12-months",
    label: "12 monthly payments",
    count: 12,
    intervalDays: 30,
    profitRate: 0.09,
    minAmount: 1_500_00,
    maxAmount: 30_000_00,
  },
];

export function getPlan(id: PlanId): InstallmentPlan {
  const plan = plans.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function isEligible(plan: InstallmentPlan, amount: number): boolean {
  return amount >= plan.minAmount && amount <= plan.maxAmount;
}

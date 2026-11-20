import type { InstallmentPlan } from "./plans";

export interface Installment {
  number: number;
  /** ISO date (YYYY-MM-DD). */
  dueDate: string;
  /** Amount in halalas. */
  amount: number;
}

export interface Schedule {
  principal: number;
  profit: number;
  total: number;
  installments: Installment[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a repayment schedule. All money is handled in integer halalas so the
 * installments always add up exactly to the total. Any remainder from the
 * division is added to the first payment (the one collected at checkout).
 */
export function buildSchedule(
  principal: number,
  plan: InstallmentPlan,
  start: Date = new Date(),
): Schedule {
  if (!Number.isInteger(principal) || principal <= 0) {
    throw new RangeError("principal must be a positive integer amount in halalas");
  }

  const profit = Math.round(principal * plan.profitRate);
  const total = principal + profit;
  const base = Math.floor(total / plan.count);
  const remainder = total - base * plan.count;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());

  const installments = Array.from({ length: plan.count }, (_, index) => ({
    number: index + 1,
    dueDate: toISODate(new Date(startUtc + index * plan.intervalDays * DAY_MS)),
    amount: index === 0 ? base + remainder : base,
  }));

  return { principal, profit, total, installments };
}

const sarFormatter = new Intl.NumberFormat("en-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 2,
});

export function formatSAR(halalas: number): string {
  return sarFormatter.format(halalas / 100);
}

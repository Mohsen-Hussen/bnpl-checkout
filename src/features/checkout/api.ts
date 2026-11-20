import { buildSchedule } from "../installments/schedule";
import { getPlan, type PlanId } from "../installments/plans";
import type { Order } from "../orders/types";
import type { ApplicantValues } from "./schema";

/** Maximum share of monthly income that installments may take (debt-burden ratio). */
export const MAX_DEBT_BURDEN_RATIO = 0.33;
export const DEMO_OTP = "1234";

export interface ApplicationRequest {
  applicant: ApplicantValues;
  planId: PlanId;
  amount: number;
  otp: string;
}

export class ApiError extends Error {
  readonly code: "INVALID_OTP";
  constructor(code: "INVALID_OTP", message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Monthly-equivalent repayment for a plan, used for the affordability check.
 * Bi-weekly plans are converted to a 30-day month.
 */
export function monthlyRepayment(amount: number, planId: PlanId): number {
  const plan = getPlan(planId);
  const { installments } = buildSchedule(amount, plan);
  const perPayment = installments[installments.length - 1].amount;
  return Math.round((perPayment * 30) / plan.intervalDays);
}

export function assessAffordability(amount: number, planId: PlanId, monthlyIncomeSar: number) {
  const repayment = monthlyRepayment(amount, planId) / 100;
  const ratio = repayment / monthlyIncomeSar;
  return { ratio, approved: ratio <= MAX_DEBT_BURDEN_RATIO };
}

let sequence = 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A mock credit-decision API with realistic latency. */
export async function submitApplication(
  request: ApplicationRequest,
  { delay = 700 }: { delay?: number } = {},
): Promise<Order> {
  await wait(delay);

  if (request.otp !== DEMO_OTP) {
    throw new ApiError("INVALID_OTP", "The verification code is incorrect.");
  }

  const { approved } = assessAffordability(
    request.amount,
    request.planId,
    Number(request.applicant.monthlyIncome),
  );

  sequence += 1;
  return {
    id: `QS-${String(900_000 + sequence).padStart(6, "0")}`,
    createdAt: new Date().toISOString(),
    customerName: request.applicant.fullName.trim(),
    planId: request.planId,
    amount: request.amount,
    status: approved ? "approved" : "declined",
    ...(approved ? {} : { declineReason: "Debt-burden ratio above limit" }),
  };
}

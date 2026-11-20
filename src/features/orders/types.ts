import type { PlanId } from "../installments/plans";

export type OrderStatus = "approved" | "declined" | "refunded";

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  planId: PlanId;
  /** Order amount in halalas (before profit). */
  amount: number;
  status: OrderStatus;
  declineReason?: string;
}

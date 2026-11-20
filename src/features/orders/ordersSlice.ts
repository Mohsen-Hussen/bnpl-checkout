import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { ApiError, submitApplication, type ApplicationRequest } from "../checkout/api";
import type { PlanId } from "../installments/plans";
import type { Order, OrderStatus } from "./types";

export interface OrdersFilter {
  status: OrderStatus | "all";
  planId: PlanId | "all";
  query: string;
}

export interface OrdersState {
  items: Order[];
  filter: OrdersFilter;
  submission: {
    status: "idle" | "pending" | "succeeded" | "failed";
    error?: string;
    lastOrderId?: string;
  };
}

export const initialOrdersState: OrdersState = {
  items: [],
  filter: { status: "all", planId: "all", query: "" },
  submission: { status: "idle" },
};

export const placeOrder = createAsyncThunk<Order, ApplicationRequest, { rejectValue: string }>(
  "orders/placeOrder",
  async (request, { rejectWithValue }) => {
    try {
      return await submitApplication(request);
    } catch (error) {
      if (error instanceof ApiError) return rejectWithValue(error.message);
      throw error;
    }
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: initialOrdersState,
  reducers: {
    refundOrder(state, action: PayloadAction<string>) {
      const order = state.items.find((item) => item.id === action.payload);
      if (order?.status === "approved") order.status = "refunded";
    },
    setFilter(state, action: PayloadAction<Partial<OrdersFilter>>) {
      state.filter = { ...state.filter, ...action.payload };
    },
    resetSubmission(state) {
      state.submission = { status: "idle" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.submission = { status: "pending" };
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.submission = { status: "succeeded", lastOrderId: action.payload.id };
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.submission = {
          status: "failed",
          error: action.payload ?? "Something went wrong. Please try again.",
        };
      });
  },
});

export const { refundOrder, setFilter, resetSubmission } = ordersSlice.actions;
export default ordersSlice.reducer;

// ---- Selectors -------------------------------------------------------------

type WithOrders = { orders: OrdersState };

export const selectOrders = (state: WithOrders) => state.orders.items;
export const selectFilter = (state: WithOrders) => state.orders.filter;
export const selectSubmission = (state: WithOrders) => state.orders.submission;

export const selectOrderById = (state: WithOrders, id: string | undefined) =>
  id ? state.orders.items.find((order) => order.id === id) : undefined;

export const selectFilteredOrders = createSelector(
  [selectOrders, selectFilter],
  (orders, filter) => {
    const query = filter.query.trim().toLowerCase();
    return orders.filter(
      (order) =>
        (filter.status === "all" || order.status === filter.status) &&
        (filter.planId === "all" || order.planId === filter.planId) &&
        (!query ||
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query)),
    );
  },
);

export const selectKpis = createSelector([selectOrders], (orders) => {
  const approved = orders.filter((order) => order.status === "approved");
  const decided = orders.filter((order) => order.status !== "refunded");
  const gmv = approved.reduce((sum, order) => sum + order.amount, 0);
  return {
    gmv,
    orders: approved.length,
    averageOrderValue: approved.length ? Math.round(gmv / approved.length) : 0,
    approvalRate: decided.length ? approved.length / decided.length : 0,
    refunds: orders.filter((order) => order.status === "refunded").length,
  };
});

/** Approved order value per day for the last `days` days, split by plan. */
export function dailyVolume(orders: Order[], days: number, now: Date = new Date()) {
  const labels: string[] = [];
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 86_400_000);
    keys.push(date.toISOString().slice(0, 10));
    labels.push(date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  }
  const empty = () => keys.map(() => 0);
  const series: Record<PlanId, number[]> = {
    "pay-in-4": empty(),
    "6-months": empty(),
    "12-months": empty(),
  };
  for (const order of orders) {
    if (order.status !== "approved") continue;
    const index = keys.indexOf(order.createdAt.slice(0, 10));
    if (index >= 0) series[order.planId][index] += order.amount / 100;
  }
  return { labels, series };
}

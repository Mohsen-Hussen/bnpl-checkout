import { describe, expect, it } from "vitest";

import { setupStore } from "../../app/store";
import reducer, {
  dailyVolume,
  initialOrdersState,
  refundOrder,
  selectFilteredOrders,
  selectKpis,
  setFilter,
} from "./ordersSlice";
import { seedOrders } from "./seed";
import type { Order } from "./types";

const order = (overrides: Partial<Order>): Order => ({
  id: "QS-000001",
  createdAt: "2026-11-20T10:00:00.000Z",
  customerName: "Sara Al-Harbi",
  planId: "pay-in-4",
  amount: 1_000_00,
  status: "approved",
  ...overrides,
});

const sample: Order[] = [
  order({ id: "QS-1", amount: 1_000_00 }),
  order({ id: "QS-2", amount: 3_000_00, planId: "6-months", customerName: "Omar Al-Otaibi" }),
  order({ id: "QS-3", status: "declined" }),
  order({ id: "QS-4", status: "refunded" }),
];

const storeWith = (items: Order[]) => setupStore({ orders: { ...initialOrdersState, items } });

describe("orders reducer", () => {
  it("refunds only approved orders", () => {
    let state = reducer({ ...initialOrdersState, items: sample }, refundOrder("QS-1"));
    expect(state.items[0].status).toBe("refunded");
    state = reducer(state, refundOrder("QS-3"));
    expect(state.items[2].status).toBe("declined");
  });
});

describe("selectors", () => {
  it("computes KPIs from approved orders", () => {
    const kpis = selectKpis(storeWith(sample).getState());
    expect(kpis).toEqual({
      gmv: 4_000_00,
      orders: 2,
      averageOrderValue: 2_000_00,
      approvalRate: 2 / 3,
      refunds: 1,
    });
  });

  it("filters by status, plan and search query", () => {
    const store = storeWith(sample);
    store.dispatch(setFilter({ status: "approved" }));
    expect(selectFilteredOrders(store.getState()).map((o) => o.id)).toEqual(["QS-1", "QS-2"]);
    store.dispatch(setFilter({ planId: "6-months" }));
    expect(selectFilteredOrders(store.getState()).map((o) => o.id)).toEqual(["QS-2"]);
    store.dispatch(setFilter({ status: "all", planId: "all", query: "omar" }));
    expect(selectFilteredOrders(store.getState()).map((o) => o.id)).toEqual(["QS-2"]);
  });

  it("memoizes filtered results", () => {
    const state = storeWith(sample).getState();
    expect(selectFilteredOrders(state)).toBe(selectFilteredOrders(state));
  });
});

describe("dailyVolume", () => {
  it("buckets approved amounts per day and plan", () => {
    const now = new Date("2026-11-20T12:00:00.000Z");
    const { labels, series } = dailyVolume(sample, 3, now);
    expect(labels).toHaveLength(3);
    expect(series["pay-in-4"]).toEqual([0, 0, 1_000]);
    expect(series["6-months"]).toEqual([0, 0, 3_000]);
  });
});

describe("seedOrders", () => {
  it("is deterministic and sorted newest first", () => {
    const now = new Date("2026-11-20T12:00:00.000Z");
    const a = seedOrders(20, now);
    expect(seedOrders(20, now)).toEqual(a);
    const dates = a.map((o) => o.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

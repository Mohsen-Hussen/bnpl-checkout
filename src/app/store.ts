import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import ordersReducer, {
  initialOrdersState,
  type OrdersState,
} from "../features/orders/ordersSlice";
import { seedOrders } from "../features/orders/seed";

const rootReducer = combineReducers({ orders: ordersReducer });
export type RootState = ReturnType<typeof rootReducer>;

const STORAGE_KEY = "qist:orders";

function loadOrders(): OrdersState["items"] | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrdersState["items"]) : undefined;
  } catch {
    return undefined;
  }
}

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

/** App store: restores saved orders (or seeds demo data) and persists changes. */
export function createAppStore() {
  const store = setupStore({
    orders: { ...initialOrdersState, items: loadOrders() ?? seedOrders() },
  });

  let previous = store.getState().orders.items;
  store.subscribe(() => {
    const current = store.getState().orders.items;
    if (current === previous) return;
    previous = current;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage unavailable — the demo keeps working in memory.
    }
  });

  return store;
}

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

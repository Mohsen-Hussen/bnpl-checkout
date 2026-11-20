import { Search } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/store";
import { Button, Card, StatusBadge } from "../../components/ui";
import { getPlan, plans, type PlanId } from "../installments/plans";
import { formatSAR } from "../installments/schedule";
import {
  refundOrder,
  selectFilter,
  selectFilteredOrders,
  selectKpis,
  selectOrders,
  setFilter,
} from "../orders/ordersSlice";
import type { OrderStatus } from "../orders/types";
import { VolumeChart } from "./VolumeChart";

const PAGE_SIZE = 12;

export function MerchantPage() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const filtered = useAppSelector(selectFilteredOrders);
  const filter = useAppSelector(selectFilter);
  const kpis = useAppSelector(selectKpis);

  const cards = [
    { label: "Approved volume", value: formatSAR(kpis.gmv) },
    { label: "Approved orders", value: kpis.orders.toLocaleString("en") },
    { label: "Average order value", value: formatSAR(kpis.averageOrderValue) },
    { label: "Approval rate", value: `${(kpis.approvalRate * 100).toFixed(1)}%` },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Merchant portal</h1>
        <p className="text-sm text-slate-500">Peak Fitness · installment orders</p>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <dt className="text-xs font-medium text-slate-500">{card.label}</dt>
            <dd className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{card.value}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Approved volume · last 14 days
        </h2>
        <VolumeChart orders={orders} />
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <h2 className="flex-1 text-sm font-semibold text-slate-900">
            Orders <span className="font-normal text-slate-500">({filtered.length})</span>
          </h2>
          <div className="relative">
            <label htmlFor="order-search" className="sr-only">
              Search orders
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="order-search"
              type="search"
              placeholder="Order ID or customer"
              value={filter.query}
              onChange={(event) => dispatch(setFilter({ query: event.target.value }))}
              className="h-10 w-full rounded-xl border border-slate-200 ps-9 pe-3 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 focus:outline-none sm:w-56"
            />
          </div>
          <label className="sr-only" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            value={filter.status}
            onChange={(event) =>
              dispatch(setFilter({ status: event.target.value as OrderStatus | "all" }))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="refunded">Refunded</option>
          </select>
          <label className="sr-only" htmlFor="plan-filter">
            Plan
          </label>
          <select
            id="plan-filter"
            value={filter.planId}
            onChange={(event) =>
              dispatch(setFilter({ planId: event.target.value as PlanId | "all" }))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Order
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, PAGE_SIZE).map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{order.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{getPlan(order.planId).label}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{formatSAR(order.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2 text-end">
                    {order.status === "approved" && (
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs"
                        onClick={() => dispatch(refundOrder(order.id))}
                        aria-label={`Refund order ${order.id}`}
                      >
                        Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-slate-500">
              No orders match these filters.
            </p>
          )}
          {filtered.length > PAGE_SIZE && (
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              Showing the latest {PAGE_SIZE} of {filtered.length} orders.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

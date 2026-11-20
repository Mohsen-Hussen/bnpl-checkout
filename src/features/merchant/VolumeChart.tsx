import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";

import { plans } from "../installments/plans";
import { dailyVolume } from "../orders/ordersSlice";
import type { Order } from "../orders/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const colors: Record<string, string> = {
  "pay-in-4": "#7c3aed",
  "6-months": "#a78bfa",
  "12-months": "#ddd6fe",
};

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      position: "bottom",
      labels: { boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 3 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          ` ${ctx.dataset.label}: SAR ${Number(ctx.raw).toLocaleString("en", { maximumFractionDigits: 0 })}`,
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: {
      stacked: true,
      border: { display: false },
      ticks: { callback: (value) => `${Number(value) / 1000}k` },
    },
  },
};

export function VolumeChart({ orders, days = 14 }: { orders: Order[]; days?: number }) {
  const data = useMemo(() => {
    const { labels, series } = dailyVolume(orders, days);
    return {
      labels,
      datasets: plans.map((plan) => ({
        label: plan.label,
        data: series[plan.id],
        backgroundColor: colors[plan.id],
        borderRadius: 4,
        maxBarThickness: 28,
      })),
    };
  }, [orders, days]);

  return (
    <div className="h-72">
      <Bar
        data={data}
        options={options}
        aria-label={`Approved volume per day, last ${days} days`}
        role="img"
      />
    </div>
  );
}

import clsx from "clsx";
import { Check } from "lucide-react";

import { isEligible, plans, type PlanId } from "./plans";
import { buildSchedule, formatSAR } from "./schedule";

interface PlanSelectorProps {
  amount: number;
  value: PlanId;
  onChange: (plan: PlanId) => void;
}

export function PlanSelector({ amount, value, onChange }: PlanSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Choose how to pay</legend>
      <div className="grid gap-3">
        {plans.map((plan) => {
          const eligible = isEligible(plan, amount);
          const schedule = eligible ? buildSchedule(amount, plan) : undefined;
          const selected = plan.id === value;
          return (
            <label
              key={plan.id}
              className={clsx(
                "relative flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors",
                selected
                  ? "border-violet-600 bg-violet-50/60"
                  : "border-slate-200 hover:border-violet-300",
                !eligible && "cursor-not-allowed opacity-50 hover:border-slate-200",
              )}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={selected}
                disabled={!eligible}
                onChange={() => onChange(plan.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={clsx(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-300",
                  selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300",
                )}
              >
                {selected && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-semibold text-slate-900">{plan.label}</span>
                <span className="text-xs text-slate-500">
                  {plan.profitRate === 0
                    ? "No profit, no fees — every 2 weeks"
                    : `${(plan.profitRate * 100).toFixed(0)}% flat profit — monthly`}
                  {!eligible &&
                    ` · available for ${formatSAR(plan.minAmount)}–${formatSAR(plan.maxAmount)}`}
                </span>
              </span>
              {schedule && (
                <span className="text-end">
                  <span className="block text-base font-bold text-slate-900">
                    {formatSAR(schedule.installments[schedule.installments.length - 1].amount)}
                  </span>
                  <span className="block text-xs text-slate-500">× {plan.count}</span>
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

import type { Schedule } from "./schedule";
import { formatSAR } from "./schedule";

export function ScheduleTable({ schedule, caption }: { schedule: Schedule; caption: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2.5 text-start font-semibold">
              #
            </th>
            <th scope="col" className="px-4 py-2.5 text-start font-semibold">
              Due
            </th>
            <th scope="col" className="px-4 py-2.5 text-end font-semibold">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schedule.installments.map((installment) => (
            <tr key={installment.number}>
              <td className="px-4 py-2.5 text-slate-500">{installment.number}</td>
              <td className="px-4 py-2.5">
                {installment.number === 1
                  ? "Today"
                  : new Date(installment.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
              </td>
              <td className="px-4 py-2.5 text-end font-medium tabular-nums">
                {formatSAR(installment.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 text-sm">
          {schedule.profit > 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-2 text-slate-500">
                Profit
              </td>
              <td className="px-4 py-2 text-end tabular-nums">{formatSAR(schedule.profit)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={2} className="px-4 py-2.5 font-semibold">
              Total
            </td>
            <td className="px-4 py-2.5 text-end font-bold tabular-nums">
              {formatSAR(schedule.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

import clsx from "clsx";
import { useField } from "formik";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

import type { OrderStatus } from "../features/orders/types";

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-violet-600 text-white hover:bg-violet-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-violet-700 hover:bg-violet-50",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  padded = true,
  children,
}: {
  className?: string;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-xs",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

const inputClasses = (invalid: boolean) =>
  clsx(
    "h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2",
    invalid
      ? "border-rose-500 focus:ring-rose-100"
      : "border-slate-200 focus:border-violet-500 focus:ring-violet-100",
  );

interface FieldShellProps {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ name, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Formik-connected text input with accessible error wiring. */
export function TextField({
  name,
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; hint?: string }) {
  const [field, meta] = useField(name);
  const error = meta.touched ? meta.error : undefined;
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <input
        id={name}
        {...field}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={inputClasses(Boolean(error))}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { name: string; label: string }) {
  const [field, meta] = useField(name);
  const error = meta.touched ? meta.error : undefined;
  return (
    <FieldShell name={name} label={label} error={error}>
      <select
        id={name}
        {...field}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClasses(Boolean(error))}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({ name, label }: { name: string; label: string }) {
  const [field, meta] = useField({ name, type: "checkbox" });
  const error = meta.touched ? meta.error : undefined;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          {...field}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="mt-0.5 size-4 accent-violet-600"
        />
        {label}
      </label>
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  declined: "bg-rose-50 text-rose-700 ring-rose-600/20",
  refunded: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

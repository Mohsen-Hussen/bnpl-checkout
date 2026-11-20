import { Form, Formik } from "formik";
import { CircleCheck, CircleX, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { useAppDispatch, useAppSelector } from "../../app/store";
import { Button, Card, CheckboxField, SelectField, TextField } from "../../components/ui";
import { cartTotals, demoCart } from "../cart/cart";
import { PlanSelector } from "../installments/PlanSelector";
import { ScheduleTable } from "../installments/ScheduleTable";
import { getPlan, isEligible, plans, type PlanId } from "../installments/plans";
import { buildSchedule, formatSAR } from "../installments/schedule";
import {
  placeOrder,
  resetSubmission,
  selectOrderById,
  selectSubmission,
} from "../orders/ordersSlice";
import { DEMO_OTP } from "./api";
import {
  applicantSchema,
  employmentTypes,
  initialApplicant,
  otpSchema,
  type ApplicantValues,
} from "./schema";

type Step = "plan" | "details" | "verify" | "result";

const stepTitles: Record<Exclude<Step, "result">, string> = {
  plan: "1. Plan",
  details: "2. Your details",
  verify: "3. Verify",
};

export function CheckoutPage() {
  const dispatch = useAppDispatch();
  const totals = cartTotals(demoCart);
  const firstEligible = plans.find((plan) => isEligible(plan, totals.total))?.id ?? "pay-in-4";

  const [step, setStep] = useState<Step>("plan");
  const [planId, setPlanId] = useState<PlanId>(firstEligible);
  const [applicant, setApplicant] = useState<ApplicantValues>(initialApplicant);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const submission = useAppSelector(selectSubmission);
  const order = useAppSelector((state) => selectOrderById(state, submission.lastOrderId));
  const schedule = useMemo(
    () => buildSchedule(totals.total, getPlan(planId)),
    [totals.total, planId],
  );

  // Move focus to the new step's heading so keyboard and screen-reader users
  // land on it — but not on first load.
  const hasNavigated = useRef(false);
  useEffect(() => {
    if (hasNavigated.current) headingRef.current?.focus();
  }, [step]);

  const goTo = (next: Step) => {
    hasNavigated.current = true;
    setStep(next);
  };

  const restart = () => {
    dispatch(resetSubmission());
    setApplicant(initialApplicant);
    goTo("plan");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        {step !== "result" && (
          <ol className="flex gap-2 text-xs font-semibold" aria-label="Checkout progress">
            {(Object.keys(stepTitles) as (keyof typeof stepTitles)[]).map((key) => (
              <li
                key={key}
                aria-current={key === step ? "step" : undefined}
                className={
                  key === step
                    ? "rounded-full bg-violet-600 px-3 py-1 text-white"
                    : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"
                }
              >
                {stepTitles[key]}
              </li>
            ))}
          </ol>
        )}

        <Card>
          {step === "plan" && (
            <>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mb-1 text-xl font-bold focus:outline-none"
              >
                Split your purchase
              </h1>
              <p className="mb-5 text-sm text-slate-500">
                Pay the first installment today and the rest later. No hidden fees.
              </p>
              <PlanSelector amount={totals.total} value={planId} onChange={setPlanId} />
              <div className="mt-6">
                <ScheduleTable schedule={schedule} caption="Repayment schedule" />
              </div>
              <Button className="mt-6 w-full" onClick={() => goTo("details")}>
                Continue
              </Button>
            </>
          )}

          {step === "details" && (
            <Formik
              initialValues={applicant}
              validationSchema={applicantSchema}
              onSubmit={(values) => {
                setApplicant(values);
                goTo("verify");
              }}
            >
              <Form noValidate className="flex flex-col gap-4">
                <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold focus:outline-none">
                  Your details
                </h1>
                <TextField name="fullName" label="Full name" autoComplete="name" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="nationalId"
                    label="National ID / Iqama"
                    inputMode="numeric"
                    maxLength={10}
                    hint="10 digits starting with 1 or 2"
                  />
                  <TextField
                    name="mobile"
                    label="Mobile number"
                    type="tel"
                    maxLength={10}
                    hint="05XXXXXXXX"
                  />
                </div>
                <TextField name="email" label="Email" type="email" autoComplete="email" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField name="employment" label="Employment">
                    <option value="" disabled>
                      Select…
                    </option>
                    {employmentTypes.map((type) => (
                      <option key={type} value={type} className="capitalize">
                        {type.replace("-", " ")}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    name="monthlyIncome"
                    label="Monthly income (SAR)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                  />
                </div>
                <CheckboxField
                  name="acceptTerms"
                  label="I agree to the installment terms and allow a credit check."
                />
                <div className="mt-2 flex gap-3">
                  <Button variant="secondary" onClick={() => goTo("plan")}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue
                  </Button>
                </div>
              </Form>
            </Formik>
          )}

          {step === "verify" && (
            <Formik
              initialValues={{ otp: "" }}
              validationSchema={otpSchema}
              onSubmit={async ({ otp }) => {
                const result = await dispatch(
                  placeOrder({ applicant, planId, amount: totals.total, otp }),
                );
                if (placeOrder.fulfilled.match(result)) goTo("result");
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate className="flex flex-col gap-4">
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-xl font-bold focus:outline-none"
                  >
                    Verify your mobile
                  </h1>
                  <p className="text-sm text-slate-500">
                    We sent a 4-digit code to <span dir="ltr">{applicant.mobile}</span>. For this
                    demo, use <strong>{DEMO_OTP}</strong>.
                  </p>
                  <TextField
                    name="otp"
                    label="Verification code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                  />
                  {submission.status === "failed" && (
                    <p
                      role="alert"
                      className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                    >
                      {submission.error}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => goTo("details")}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 aria-hidden className="size-4 animate-spin" />}
                      {isSubmitting
                        ? "Checking eligibility…"
                        : `Pay ${formatSAR(schedule.installments[0].amount)} now`}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {step === "result" && order && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              {order.status === "approved" ? (
                <>
                  <CircleCheck aria-hidden className="size-14 text-emerald-600" />
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-xl font-bold focus:outline-none"
                  >
                    You're approved!
                  </h1>
                  <p className="text-sm text-slate-500">
                    Order <span className="font-mono font-semibold text-slate-800">{order.id}</span>{" "}
                    is confirmed. Here is your repayment schedule:
                  </p>
                  <div className="w-full text-start">
                    <ScheduleTable schedule={schedule} caption="Your repayment schedule" />
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="/merchant"
                      className="inline-flex h-11 items-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                      See it in the merchant portal
                    </Link>
                    <Button variant="secondary" onClick={restart}>
                      New checkout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CircleX aria-hidden className="size-14 text-rose-600" />
                  <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-xl font-bold focus:outline-none"
                  >
                    We couldn't approve this plan
                  </h1>
                  <p className="max-w-md text-sm text-slate-500">
                    The monthly installments would take more than a third of your income. Try a
                    longer plan to lower each payment.
                  </p>
                  <Button onClick={restart}>Choose another plan</Button>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      <aside className="flex flex-col gap-4">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Order summary · Peak Fitness
          </h2>
          <ul className="flex flex-col gap-3">
            {demoCart.map((item) => (
              <li key={item.sku} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium text-slate-900">{item.name}</span>
                  <span className="text-xs text-slate-500">
                    {item.variant} · Qty {item.quantity}
                  </span>
                </span>
                <span className="tabular-nums">{formatSAR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatSAR(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>VAT (15%)</dt>
              <dd className="tabular-nums">{formatSAR(totals.vat)}</dd>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatSAR(totals.total)}</dd>
            </div>
          </dl>
        </Card>
        <p className="flex items-center gap-2 px-2 text-xs text-slate-500">
          <ShieldCheck aria-hidden className="size-4 text-emerald-600" />
          Flat profit, no late fees. <Lock aria-hidden className="size-3.5" /> Demo — no real
          payment.
        </p>
      </aside>
    </div>
  );
}

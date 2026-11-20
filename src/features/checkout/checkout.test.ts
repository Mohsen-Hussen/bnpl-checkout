import { describe, expect, it } from "vitest";

import { assessAffordability, monthlyRepayment, submitApplication } from "./api";
import { applicantSchema, initialApplicant, type ApplicantValues } from "./schema";

const applicant: ApplicantValues = {
  fullName: "Mohsen Hussein",
  nationalId: "1234567890",
  mobile: "0551234567",
  email: "mohsen@example.com",
  employment: "private",
  monthlyIncome: 15_000,
  acceptTerms: true,
};

async function errorsFor(values: Partial<ApplicantValues>) {
  try {
    await applicantSchema.validate({ ...applicant, ...values }, { abortEarly: false });
    return {};
  } catch (error) {
    const inner = (error as { inner: { path: string; message: string }[] }).inner;
    return Object.fromEntries(inner.map((e) => [e.path, e.message]));
  }
}

describe("applicantSchema", () => {
  it("accepts a valid applicant", async () => {
    await expect(applicantSchema.isValid(applicant)).resolves.toBe(true);
  });

  it("reports every missing field on an empty form", async () => {
    const errors = await errorsFor(initialApplicant);
    expect(Object.keys(errors).sort()).toEqual(
      [
        "acceptTerms",
        "email",
        "employment",
        "fullName",
        "mobile",
        "monthlyIncome",
        "nationalId",
      ].sort(),
    );
  });

  it.each([
    [{ nationalId: "3123456789" }, "nationalId"],
    [{ mobile: "0661234567" }, "mobile"],
    [{ email: "nope" }, "email"],
    [{ monthlyIncome: 1_500 }, "monthlyIncome"],
  ])("rejects %o", async (override, field) => {
    expect(await errorsFor(override)).toHaveProperty(field);
  });
});

describe("affordability", () => {
  it("converts bi-weekly payments to a monthly figure", () => {
    // 4 × SAR 250 every 14 days ≈ SAR 535.71 per 30 days
    expect(monthlyRepayment(1_000_00, "pay-in-4")).toBe(535_71);
  });

  it("declines when installments exceed a third of income", () => {
    expect(assessAffordability(5_643_05, "6-months", 15_000).approved).toBe(true);
    expect(assessAffordability(5_643_05, "6-months", 2_500).approved).toBe(false);
  });
});

describe("submitApplication", () => {
  it("rejects a wrong OTP", async () => {
    await expect(
      submitApplication(
        { applicant, planId: "6-months", amount: 1_000_00, otp: "0000" },
        { delay: 0 },
      ),
    ).rejects.toThrow("verification code");
  });

  it("returns an approved order for an affordable plan", async () => {
    const order = await submitApplication(
      { applicant, planId: "6-months", amount: 1_000_00, otp: "1234" },
      { delay: 0 },
    );
    expect(order).toMatchObject({
      status: "approved",
      customerName: "Mohsen Hussein",
      planId: "6-months",
    });
  });

  it("returns a declined order with a reason when unaffordable", async () => {
    const order = await submitApplication(
      {
        applicant: { ...applicant, monthlyIncome: 3_000 },
        planId: "pay-in-4",
        amount: 4_000_00,
        otp: "1234",
      },
      { delay: 0 },
    );
    expect(order.status).toBe("declined");
    expect(order.declineReason).toMatch(/debt-burden/i);
  });
});

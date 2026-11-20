import * as Yup from "yup";

export const employmentTypes = ["government", "private", "self-employed", "retired"] as const;
export type EmploymentType = (typeof employmentTypes)[number];

export interface ApplicantValues {
  fullName: string;
  nationalId: string;
  mobile: string;
  email: string;
  employment: EmploymentType | "";
  monthlyIncome: number | "";
  acceptTerms: boolean;
}

export const initialApplicant: ApplicantValues = {
  fullName: "",
  nationalId: "",
  mobile: "",
  email: "",
  employment: "",
  monthlyIncome: "",
  acceptTerms: false,
};

export const MIN_MONTHLY_INCOME = 2_000;

export const applicantSchema = Yup.object({
  fullName: Yup.string().trim().required("Full name is required").min(3, "Enter your full name"),
  nationalId: Yup.string()
    .required("National ID / Iqama is required")
    .matches(/^[12]\d{9}$/, "Must be 10 digits starting with 1 or 2"),
  mobile: Yup.string()
    .required("Mobile number is required")
    .matches(/^05\d{8}$/, "Use the format 05XXXXXXXX"),
  email: Yup.string().trim().required("Email is required").email("Enter a valid email"),
  employment: Yup.string()
    .oneOf([...employmentTypes], "Select your employment type")
    .required("Select your employment type"),
  monthlyIncome: Yup.number()
    .typeError("Enter your monthly income")
    .required("Enter your monthly income")
    .min(
      MIN_MONTHLY_INCOME,
      `Minimum monthly income is SAR ${MIN_MONTHLY_INCOME.toLocaleString("en")}`,
    ),
  acceptTerms: Yup.boolean().oneOf([true], "You must accept the terms to continue"),
});

export const otpSchema = Yup.object({
  otp: Yup.string()
    .required("Enter the 4-digit code")
    .matches(/^\d{4}$/, "The code must be 4 digits"),
});

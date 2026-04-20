import { getTenDigitPhoneError } from "@/lib/validation/phone";

export type CommitteeOfficialRole =
  | "PRESIDENT"
  | "MEMBER"
  | "SECRETARY"
  | "TREASURER";

export type CommitteeFormState = {
  name: string;
  address: string;
  fiscalYear: string;
  formedDate: string;
  bankName: string;
  accountNumber: string;
};

export type CommitteeOfficialDraft = {
  id: string;
  role: CommitteeOfficialRole;
  name: string;
  phoneNumber: string;
  citizenshipNumber: string;
};

export type CommitteeFormErrors = Partial<
  Record<keyof CommitteeFormState | "bsDate", string>
>;

export type CommitteeOfficialErrors = Partial<
  Record<"name" | "phoneNumber" | "citizenshipNumber", string>
>;

const FISCAL_YEAR_PATTERN = /^\d{4}\/\d{3}$/;

export function validateCommitteeForm(
  formData: CommitteeFormState,
  options?: { requireBsDate?: boolean; bsDate?: string }
) {
  const errors: CommitteeFormErrors = {};

  if (formData.name.trim().length < 3) {
    errors.name = "Committee name must be at least 3 characters.";
  }

  if (formData.address.trim().length < 3) {
    errors.address = "Address must be at least 3 characters.";
  }

  if (!FISCAL_YEAR_PATTERN.test(formData.fiscalYear.trim())) {
    errors.fiscalYear = "Fiscal year must be in 2082/083 format.";
  }

  if (!formData.formedDate) {
    errors.formedDate = "Please enter a valid formed date.";
  }

  if (options?.requireBsDate && !options.bsDate?.trim()) {
    errors.bsDate = "Please enter the formed date in BS format.";
  }

  if (formData.bankName.trim().length < 2) {
    errors.bankName = "Bank name must be at least 2 characters.";
  }

  if (formData.accountNumber.trim().length < 5) {
    errors.accountNumber = "Account number must be at least 5 characters.";
  }

  return errors;
}

export function validateCommitteeOfficial(official: CommitteeOfficialDraft) {
  const errors: CommitteeOfficialErrors = {};

  if (official.name.trim().length < 2) {
    errors.name = "Official name must be at least 2 characters.";
  }

  const phoneError = getTenDigitPhoneError(official.phoneNumber, {
    label: "Phone number",
    required: true,
  });
  if (phoneError) {
    errors.phoneNumber = phoneError;
  }

  if (
    official.citizenshipNumber.trim().length > 0 &&
    official.citizenshipNumber.trim().length < 3
  ) {
    errors.citizenshipNumber =
      "Citizenship number must be at least 3 characters if provided.";
  }

  return errors;
}

export function validateCommitteeOfficials(officials: CommitteeOfficialDraft[]) {
  return officials.reduce<Record<string, CommitteeOfficialErrors>>((acc, official) => {
    acc[official.id] = validateCommitteeOfficial(official);
    return acc;
  }, {});
}

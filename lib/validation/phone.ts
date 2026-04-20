export const TEN_DIGIT_PHONE_LENGTH = 10;
export const TEN_DIGIT_PHONE_PATTERN = /^\d{10}$/;

export function sanitizeTenDigitPhone(value: string) {
  return value.replace(/\D/g, "").slice(0, TEN_DIGIT_PHONE_LENGTH);
}

export function getTenDigitPhoneError(
  value: string,
  options?: { label?: string; required?: boolean }
) {
  const label = options?.label ?? "Phone number";
  const required = options?.required ?? false;
  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${label} is required.` : undefined;
  }

  if (!TEN_DIGIT_PHONE_PATTERN.test(trimmed)) {
    return `${label} must be exactly 10 digits.`;
  }

  return undefined;
}

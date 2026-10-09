type ApiErrorShape = {
  code?: string;
  message?: string;
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

/** Pulls a human-readable message out of an axios/Nest error. */
export function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as ApiErrorShape | null | undefined;
  const message = err?.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message) return message;

  return fallback;
}

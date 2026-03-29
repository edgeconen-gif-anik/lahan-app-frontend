const GOOGLE_CLIENT_ID_PLACEHOLDER = "your-google-client-id";
const GOOGLE_CLIENT_SECRET_PLACEHOLDER = "your-google-client-secret";

function isUsableEnvValue(value: string | undefined, placeholder?: string) {
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return false;
  }

  if (placeholder && normalizedValue === placeholder) {
    return false;
  }

  return true;
}

export function getGoogleOAuthConfig() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const hasClientId = isUsableEnvValue(
    clientId,
    GOOGLE_CLIENT_ID_PLACEHOLDER
  );
  const hasClientSecret = isUsableEnvValue(
    clientSecret,
    GOOGLE_CLIENT_SECRET_PLACEHOLDER
  );

  return {
    clientId: hasClientId ? clientId!.trim() : undefined,
    clientSecret: hasClientSecret ? clientSecret!.trim() : undefined,
    isEnabled: hasClientId && hasClientSecret,
  };
}

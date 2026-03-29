const GOOGLE_CLIENT_ID_PLACEHOLDER = "your-google-client-id";
const GOOGLE_CLIENT_SECRET_PLACEHOLDER = "your-google-client-secret";
const AUTH_BASE_URL_ENV_NAMES = ["NEXTAUTH_URL", "AUTH_URL"] as const;

function normalizeAuthBaseUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const normalizedPath =
      parsedUrl.pathname === "/"
        ? ""
        : parsedUrl.pathname.replace(/\/+$/, "");

    return `${parsedUrl.origin}${normalizedPath}`;
  } catch {
    return undefined;
  }
}

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
  const authBaseUrl = normalizeAuthBaseUrl(
    process.env.NEXTAUTH_URL || process.env.AUTH_URL
  );

  const hasClientId = isUsableEnvValue(
    clientId,
    GOOGLE_CLIENT_ID_PLACEHOLDER
  );
  const hasClientSecret = isUsableEnvValue(
    clientSecret,
    GOOGLE_CLIENT_SECRET_PLACEHOLDER
  );
  const isOAuthConfigured = hasClientId && hasClientSecret;
  const redirectUri = authBaseUrl
    ? `${authBaseUrl}/api/auth/callback/google`
    : undefined;

  let setupMessage: string | undefined;

  if (!isOAuthConfigured) {
    setupMessage =
      "Google sign-in needs real GOOGLE_CLIENT_SECRET and GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID values in .env.local.";
  } else if (!authBaseUrl) {
    setupMessage = `Google sign-in also needs ${AUTH_BASE_URL_ENV_NAMES.join(
      " or "
    )} set to the exact app URL, for example http://localhost:3000.`;
  }

  return {
    clientId: hasClientId ? clientId!.trim() : undefined,
    clientSecret: hasClientSecret ? clientSecret!.trim() : undefined,
    authBaseUrl,
    redirectUri,
    isEnabled: isOAuthConfigured,
    isReady: isOAuthConfigured && Boolean(redirectUri),
    setupMessage,
  };
}

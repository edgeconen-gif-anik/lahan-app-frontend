import { Suspense } from "react";
import LoginContent from "./LoginContent";
import { getGoogleOAuthConfig } from "@/lib/auth/google-auth";

export default function LoginPage() {
  const { isEnabled: isGoogleLoginEnabled } = getGoogleOAuthConfig();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent isGoogleLoginEnabled={isGoogleLoginEnabled} />
    </Suspense>
  );
}

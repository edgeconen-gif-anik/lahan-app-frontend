import { getSession, signOut } from "next-auth/react";

let logoutPromise: Promise<void> | null = null;

function getBackendUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000").replace(
    /\/$/,
    "",
  );
}

async function revokeBackendSession() {
  const session = await getSession();

  if (!session?.accessToken) {
    return;
  }

  await fetch(`${getBackendUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
}

export function logoutFromApp(callbackUrl = "/login") {
  if (!logoutPromise) {
    logoutPromise = revokeBackendSession()
      .finally(() => signOut({ callbackUrl }))
      .then(() => undefined)
      .finally(() => {
        logoutPromise = null;
      });
  }

  return logoutPromise;
}

const DEFAULT_BACKEND_URL = "http://127.0.0.1:5000";

function isLoopbackHost(value: string) {
  try {
    const parsedUrl = new URL(value);
    return ["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function getBackendUrlConfig() {
  const url =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND_URL;

  const isReady =
    Boolean(url) &&
    !(process.env.NODE_ENV === "production" && isLoopbackHost(url));

  return {
    url,
    isReady,
    setupMessage:
      "Backend API URL is missing. Set BACKEND_URL or NEXT_PUBLIC_API_URL and redeploy.",
  };
}

import axios from "axios";
import { NextResponse } from "next/server";

import { getBackendUrlConfig } from "@/lib/auth/backend-url";

function isLoopbackHost(value: string) {
  try {
    const parsedUrl = new URL(value);
    return ["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const { url, isReady, setupMessage } = getBackendUrlConfig();

  if (!isReady) {
    return NextResponse.json(
      { message: setupMessage },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const response = await axios.post(`${url}/auth/forgot-password`, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data as { message: string; resetUrl?: string };

    if (data.resetUrl && isLoopbackHost(data.resetUrl)) {
      const requestOrigin = new URL(request.url).origin;
      const parsedResetUrl = new URL(data.resetUrl);
      data.resetUrl = `${requestOrigin}${parsedResetUrl.pathname}${parsedResetUrl.search}`;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        error.response.data,
        { status: error.response.status }
      );
    }

    console.error("Forgot password proxy failed:", error);
    return NextResponse.json(
      { message: "Unable to start password reset right now." },
      { status: 503 }
    );
  }
}

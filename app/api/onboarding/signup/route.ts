import axios from "axios";
import { NextResponse } from "next/server";

import { getBackendUrlConfig } from "@/lib/auth/backend-url";

const ONBOARDING_REQUEST_TIMEOUT_MS = 20000;

function rewriteToRequestOrigin(value: string, requestUrl: string) {
  const parsedUrl = new URL(value);
  const requestOrigin = new URL(requestUrl).origin;

  return `${requestOrigin}${parsedUrl.pathname}${parsedUrl.search}`;
}

export async function POST(request: Request) {
  const { url, isReady, setupMessage } = getBackendUrlConfig();

  if (!isReady) {
    return NextResponse.json({ message: setupMessage }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await axios.post(`${url}/auth/signup`, body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: ONBOARDING_REQUEST_TIMEOUT_MS,
    });

    const data = response.data as { message: string; verifyUrl?: string };

    if (data.verifyUrl) {
      data.verifyUrl = rewriteToRequestOrigin(data.verifyUrl, request.url);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }

    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return NextResponse.json(
        { message: "Signup timed out. Please try again." },
        { status: 504 },
      );
    }

    console.error("Signup proxy failed:", error);
    return NextResponse.json(
      { message: "Unable to create account right now." },
      { status: 503 },
    );
  }
}

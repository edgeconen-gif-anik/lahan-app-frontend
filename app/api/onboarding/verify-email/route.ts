import axios from "axios";
import { NextResponse } from "next/server";

import { getBackendUrlConfig } from "@/lib/auth/backend-url";

const ONBOARDING_REQUEST_TIMEOUT_MS = 20000;

export async function POST(request: Request) {
  const { url, isReady, setupMessage } = getBackendUrlConfig();

  if (!isReady) {
    return NextResponse.json({ message: setupMessage }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await axios.post(`${url}/auth/verify-email`, body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: ONBOARDING_REQUEST_TIMEOUT_MS,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }

    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return NextResponse.json(
        { message: "Email verification timed out. Please try again." },
        { status: 504 },
      );
    }

    console.error("Email verification proxy failed:", error);
    return NextResponse.json(
      { message: "Unable to verify email right now." },
      { status: 503 },
    );
  }
}

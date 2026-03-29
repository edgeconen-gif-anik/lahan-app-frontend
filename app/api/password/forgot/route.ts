import axios from "axios";
import { NextResponse } from "next/server";

import { getBackendUrlConfig } from "@/lib/auth/backend-url";

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

    return NextResponse.json(response.data, { status: response.status });
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

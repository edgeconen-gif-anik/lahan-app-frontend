"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let cancelled = false;

    async function verifyEmail() {
      if (!token) {
        setState("error");
        setMessage("This verification link is missing a token.");
        return;
      }

      try {
        const response = await fetch("/api/onboarding/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          signal: AbortSignal.timeout(25000),
        });

        const data = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(
            data.message || "Verification link is invalid or expired.",
          );
        }

        if (!cancelled) {
          setState("success");
          setMessage(
            data.message ||
              "Email verified. Your account is waiting for admin approval.",
          );
        }
      } catch (error) {
        console.error("Email verification failed:", error);

        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof DOMException && error.name === "TimeoutError"
              ? "Email verification timed out. Please try again."
              : error instanceof Error
                ? error.message
                : "Unable to verify email right now.",
          );
        }
      }
    }

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            Account access is enabled after administrator approval.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert variant={state === "error" ? "destructive" : "default"}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {isLoading
                ? "Verifying"
                : isSuccess
                  ? "Email Verified"
                  : "Verification Failed"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="justify-center">
          <Button asChild variant={isSuccess ? "default" : "outline"}>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

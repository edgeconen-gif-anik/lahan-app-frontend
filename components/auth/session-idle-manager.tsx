"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { logoutFromApp } from "@/lib/auth/logout";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_HEARTBEAT_INTERVAL_MS,
  SESSION_IDLE_CHECK_INTERVAL_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WARNING_MS,
} from "@/lib/auth/session-config";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function IdleWarningDialog({
  deadline,
  onStay,
  onSignOut,
}: {
  deadline: number;
  onStay: () => void;
  onSignOut: () => void;
}) {
  const [remaining, setRemaining] = useState(() => deadline - Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setRemaining(deadline - Date.now()),
      1000,
    );
    return () => window.clearInterval(intervalId);
  }, [deadline]);

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Still there?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed out in{" "}
            <span className="font-mono font-semibold text-foreground">
              {formatCountdown(remaining)}
            </span>{" "}
            because of inactivity. A contract in progress is kept as a draft on
            this device; other unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onSignOut}>
            Sign out now
          </Button>
          <Button type="button" onClick={onStay}>
            Stay signed in
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SessionIdleManager() {
  const { data: session, status } = useSession();
  const lastActivityAtRef = useRef(Date.now());
  const lastKeepAliveAtRef = useRef(Date.now());
  const actionInFlightRef = useRef(false);
  const [warningDeadline, setWarningDeadline] = useState<number | null>(null);

  const keepAlive = useCallback(async () => {
    if (actionInFlightRef.current) {
      return;
    }

    actionInFlightRef.current = true;

    try {
      await apiPost("/auth/verify");
    } catch {
      // Ignore keepalive failures here. A 401 is handled centrally by the API client.
    } finally {
      lastKeepAliveAtRef.current = Date.now();
      actionInFlightRef.current = false;
    }
  }, []);

  const signOut = useCallback(async (reason: "idle" | "maxage") => {
    if (actionInFlightRef.current) {
      return;
    }

    actionInFlightRef.current = true;

    try {
      await logoutFromApp(`/login?reason=${reason}`);
    } finally {
      actionInFlightRef.current = false;
    }
  }, []);

  const handleStaySignedIn = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    setWarningDeadline(null);
    void keepAlive();
  }, [keepAlive]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const now = Date.now();
    lastActivityAtRef.current = now;
    lastKeepAliveAtRef.current = now;
    actionInFlightRef.current = false;

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const tick = async () => {
      if (actionInFlightRef.current) {
        return;
      }

      const currentTime = Date.now();
      const idleFor = currentTime - lastActivityAtRef.current;
      const absoluteAge = session?.sessionStartedAt
        ? currentTime - session.sessionStartedAt
        : 0;

      if (
        absoluteAge >= SESSION_ABSOLUTE_TIMEOUT_MS ||
        session?.error === "SessionMaxAgeExceeded"
      ) {
        setWarningDeadline(null);
        await signOut("maxage");
        return;
      }

      if (idleFor >= SESSION_IDLE_TIMEOUT_MS) {
        setWarningDeadline(null);
        await signOut("idle");
        return;
      }

      // Any activity (even a click inside the dialog) pushes the deadline out,
      // so the prompt closes by itself once the user is back.
      if (idleFor >= SESSION_IDLE_TIMEOUT_MS - SESSION_IDLE_WARNING_MS) {
        setWarningDeadline(
          lastActivityAtRef.current + SESSION_IDLE_TIMEOUT_MS,
        );
        return;
      }

      setWarningDeadline(null);

      const hasUnsyncedActivity =
        lastActivityAtRef.current > lastKeepAliveAtRef.current;
      const heartbeatIsDue =
        currentTime - lastKeepAliveAtRef.current >=
        SESSION_HEARTBEAT_INTERVAL_MS;

      if (!hasUnsyncedActivity || !heartbeatIsDue) {
        return;
      }

      await keepAlive();
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity);
    });

    const intervalId = window.setInterval(() => {
      void tick();
    }, SESSION_IDLE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [keepAlive, session?.error, session?.sessionStartedAt, signOut, status]);

  if (warningDeadline === null) {
    return null;
  }

  return (
    <IdleWarningDialog
      deadline={warningDeadline}
      onStay={handleStaySignedIn}
      onSignOut={() => void signOut("idle")}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

import { apiPost } from "@/lib/api";
import {
  SESSION_ABSOLUTE_TIMEOUT_MS,
  SESSION_HEARTBEAT_INTERVAL_MS,
  SESSION_IDLE_CHECK_INTERVAL_MS,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session-config";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

export function SessionIdleManager() {
  const { data: session, status } = useSession();
  const lastActivityAtRef = useRef(Date.now());
  const lastKeepAliveAtRef = useRef(Date.now());
  const actionInFlightRef = useRef(false);

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
        idleFor >= SESSION_IDLE_TIMEOUT_MS ||
        absoluteAge >= SESSION_ABSOLUTE_TIMEOUT_MS ||
        session?.error === "SessionMaxAgeExceeded"
      ) {
        actionInFlightRef.current = true;

        try {
          await signOut({ callbackUrl: "/login" });
        } finally {
          actionInFlightRef.current = false;
        }

        return;
      }

      const hasUnsyncedActivity =
        lastActivityAtRef.current > lastKeepAliveAtRef.current;
      const heartbeatIsDue =
        currentTime - lastKeepAliveAtRef.current >=
        SESSION_HEARTBEAT_INTERVAL_MS;

      if (!hasUnsyncedActivity || !heartbeatIsDue) {
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
  }, [session?.error, session?.sessionStartedAt, status]);

  return null;
}

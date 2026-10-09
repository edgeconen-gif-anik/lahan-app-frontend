"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ParamUpdates = Record<string, string | number | null | undefined>;

/**
 * Keeps list state (search, filters, sort, page) in the URL so a refresh, the
 * browser Back button and a shared link all land on the same view.
 *
 * Any update that does not set `page` itself sends the list back to page 1.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string, fallback = "") => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const getInt = useCallback(
    (key: string, fallback: number) => {
      const parsed = Number(searchParams.get(key));
      return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
    },
    [searchParams],
  );

  const update = useCallback(
    (updates: ParamUpdates) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      if (!("page" in updates)) {
        params.delete("page");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clear = useCallback(
    (keys: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      keys.forEach((key) => params.delete(key));
      params.delete("page");

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { get, getInt, update, clear };
}

"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs, type Breadcrumb } from "@/components/breadcrumbs";
import { NAV_GROUPS } from "./navigation";

const SEGMENT_LABELS: Record<string, string> = {
  new: "New",
  edit: "Edit",
  agreement: "Agreement",
  certificate: "Certificate",
  workorder: "Work Order",
  "work-order": "Work Order",
  "contract-update": "Contract Update",
  "payment-form": "Payment Form",
  "demand-form": "Demand Form",
  "fuel-coupon": "Fuel Coupon",
  "log-book": "Log Book",
  print: "Print",
  contract: "Contract",
};

const SECTION_LABELS = new Map(
  NAV_GROUPS.flatMap((group) => group.items).map((item) => [
    item.href.split("/")[2],
    item.label,
  ]),
);

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-|^\d+$/i;

function buildCrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean).slice(1); // drop "dashboard"
  const crumbs: Breadcrumb[] = [{ label: "Overview", href: "/dashboard" }];
  let href = "/dashboard";

  segments.forEach((segment, index) => {
    href += `/${segment}`;
    const label =
      index === 0
        ? (SECTION_LABELS.get(segment) ?? segment)
        : ID_PATTERN.test(segment)
          ? "Details"
          : (SEGMENT_LABELS[segment] ?? segment);

    crumbs.push({ label, href });
  });

  return crumbs;
}

/**
 * Trail shown above sub-pages (details, edit, forms). Top-level list pages
 * and the overview don't need one.
 */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const depth = pathname.split("/").filter(Boolean).length - 1;

  if (depth < 2) return null;

  return (
    <div className="mb-4 print:hidden">
      <Breadcrumbs items={buildCrumbs(pathname)} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileBadge,
  FileSignature,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useCompany } from "@/hooks/company/useCompany";
import { useContracts } from "@/hooks/contract/useContracts";
import {
  getCompanyContractCount,
  getCompanyIsContracted,
} from "@/lib/schema/company.schema";
import type { Contract } from "@/lib/schema/contract/contract";
import { isApprovedStatus } from "@/lib/schema/approval";
import { toFormalNepaliDate, toNepaliDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_STYLES: Record<string, string> = {
  WORKS:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  SUPPLY:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  CONSULTING:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
  OTHER:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function formatDate(dateString?: string | Date | null) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return {
    ad: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    adShort: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    bs: toFormalNepaliDate(date),
    bsShort: toNepaliDate(date),
  };
}

function formatCurrency(value?: number | string | null) {
  if (value == null || value === "") return "Rs. 0";
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function metricTone(tone: "sky" | "emerald" | "violet" | "amber") {
  switch (tone) {
    case "sky":
      return "border-sky-200/80 bg-white/85 text-sky-700 dark:border-sky-900 dark:bg-slate-950/40 dark:text-sky-300";
    case "emerald":
      return "border-emerald-200/80 bg-white/85 text-emerald-700 dark:border-emerald-900 dark:bg-slate-950/40 dark:text-emerald-300";
    case "violet":
      return "border-violet-200/80 bg-white/85 text-violet-700 dark:border-violet-900 dark:bg-slate-950/40 dark:text-violet-300";
    case "amber":
      return "border-amber-200/80 bg-white/85 text-amber-700 dark:border-amber-900 dark:bg-slate-950/40 dark:text-amber-300";
  }
}

function CompanyMetricCard({
  description,
  icon,
  tone,
  title,
  value,
}: {
  description: string;
  icon: ReactNode;
  tone: "sky" | "emerald" | "violet" | "amber";
  title: string;
  value: string | number;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[28px] border py-0 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1",
        metricTone(tone)
      )}
    >
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-2xl border border-current/15 bg-white/80 p-3 shadow-sm dark:bg-slate-950/40">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroDetailPill({
  href,
  icon,
  label,
  value,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const content = (
    <div
      className={cn(
        "group flex min-w-[220px] flex-1 items-start gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition-colors",
        href
          ? "hover:border-primary/30 hover:bg-white"
          : "dark:border-slate-800 dark:bg-slate-950/40",
        href
          ? "dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-primary/30 dark:hover:bg-slate-950/70"
          : ""
      )}
    >
      <div className="mt-0.5 rounded-xl border border-primary/10 bg-primary/5 p-2.5 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
      {href ? (
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} className="flex flex-1" aria-label={`${label}: ${value}`}>
      {content}
    </a>
  );
}

function SectionJumpLink({
  description,
  href,
  icon,
  label,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="group flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white dark:border-slate-800 dark:bg-slate-950/35 dark:hover:border-primary/25 dark:hover:bg-slate-950/65"
    >
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-2.5 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </a>
  );
}

function QuickActionLink({
  disabled = false,
  href,
  icon,
  label,
  subtitle,
}: {
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
  subtitle: string;
}) {
  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-[22px] border px-4 py-4 transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500"
          : "border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white hover:text-primary dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-primary/40 dark:hover:bg-slate-950/75"
      )}
    >
      <div className="mt-0.5 rounded-2xl border border-current/10 bg-current/5 p-2.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
      </div>
      {!disabled ? (
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      ) : null}
    </div>
  );

  if (!href || disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function WorkflowItem({
  complete,
  description,
  label,
}: {
  complete: boolean;
  description: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div
        className={cn(
          "mt-1.5 h-2.5 w-2.5 rounded-full",
          complete ? "bg-emerald-500" : "bg-amber-500"
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function OverviewField({
  helper,
  icon,
  label,
  mono = false,
  value,
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4 transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-900/35 dark:hover:bg-slate-950/55">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-3 text-base font-semibold text-foreground",
          mono ? "font-mono text-lg" : ""
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

function DateTimelineRow({
  description,
  label,
  tone,
  value,
}: {
  description: string;
  label: string;
  tone: "sky" | "emerald" | "slate";
  value: ReturnType<typeof formatDate>;
}) {
  const toneClass =
    tone === "sky"
      ? "bg-sky-500 text-sky-700 dark:text-sky-300"
      : tone === "emerald"
        ? "bg-emerald-500 text-emerald-700 dark:text-emerald-300"
        : "bg-slate-500 text-slate-700 dark:text-slate-200";

  return (
    <div className="flex gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="hidden sm:flex sm:flex-col sm:items-center">
        <span className={cn("mt-1 h-3 w-3 rounded-full", toneClass.split(" ")[0])} />
        <span className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="text-left sm:text-right">
          {value ? (
            <>
              <p className={cn("text-sm font-semibold", toneClass.split(" ").slice(1).join(" "))}>
                {value.bs}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {value.ad}
              </p>
            </>
          ) : (
            <span className="text-sm italic text-muted-foreground">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  href,
  icon,
  label,
  note,
  value,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  note: string;
  value: string;
}) {
  const isPlaceholder = value === "N/A" || value === "Not provided";
  const interactive = Boolean(href) && !isPlaceholder;

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/75 px-4 py-4 transition-colors dark:border-slate-800 dark:bg-slate-900/35",
        interactive
          ? "hover:border-primary/30 hover:bg-white dark:hover:border-primary/30 dark:hover:bg-slate-950/55"
          : ""
      )}
    >
      <div className="mt-0.5 rounded-xl border border-primary/10 bg-primary/5 p-2 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 break-words text-sm font-medium text-foreground">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      </div>
      {interactive ? (
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      ) : null}
    </div>
  );

  if (!interactive) {
    return content;
  }

  return <a href={href}>{content}</a>;
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function StatusRow({
  description,
  label,
  status,
}: {
  description: string;
  label: string;
  status: "verified" | "pending" | "active" | "none" | "ready" | "locked";
}) {
  const statusMap = {
    verified: {
      label: "Verified",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    pending: {
      label: "Pending",
      tone: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    },
    active: {
      label: "Active",
      tone: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    },
    none: {
      label: "None",
      tone: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    ready: {
      label: "Ready",
      tone: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
    },
    locked: {
      label: "Locked",
      tone: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  };

  const item = statusMap[status];

  return (
    <div className="flex items-start justify-between gap-3 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <StatusPill label={item.label} tone={item.tone} />
    </div>
  );
}

function ContractDocumentLink({
  href,
  icon,
  label,
  ready,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  ready: boolean;
  tone: "sky" | "violet";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        tone === "sky"
          ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
          : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "ml-1 h-2 w-2 rounded-full",
          ready ? "bg-emerald-500" : "bg-amber-400"
        )}
      />
    </Link>
  );
}

function ContractPortfolioCard({ contract }: { contract: Contract }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/45">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="font-mono text-base font-semibold text-primary hover:underline"
          >
            {contract.contractNumber}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(contract.contractAmount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ContractStatusBadge status={contract.status} />
          <ApprovalStatusBadge status={contract.approvalStatus} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 dark:border-slate-800 dark:bg-slate-900/35">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {contract.project?.name ?? "Unlinked project"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Updated {formatDate(contract.updatedAt)?.adShort ?? "N/A"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/75 p-4 dark:border-slate-800 dark:bg-slate-900/35">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Timeline
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            Start: {toNepaliDate(contract.startDate) ?? "-"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Target: {toNepaliDate(contract.intendedCompletionDate) ?? "-"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ContractDocumentLink
          href={`/dashboard/contracts/${contract.id}/agreement`}
          icon={<FileSignature className="h-3.5 w-3.5" />}
          label="Agreement"
          ready={Boolean(contract.agreement)}
          tone="sky"
        />
        <ContractDocumentLink
          href={`/dashboard/contracts/${contract.id}/work-order`}
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          label="Work order"
          ready={Boolean(contract.workOrder)}
          tone="violet"
        />
      </div>

      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/contracts/${contract.id}`}>View Contract</Link>
        </Button>
      </div>
    </div>
  );
}

function ContractRow({ contract }: { contract: Contract }) {
  return (
    <tr className="border-t border-slate-200/80 align-top dark:border-slate-800">
      <td className="px-6 py-5">
        <div className="space-y-1.5">
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {contract.contractNumber}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(contract.contractAmount)}
          </p>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            {contract.project?.name ?? "Unlinked project"}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {formatDate(contract.updatedAt)?.adShort ?? "N/A"}
          </p>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-2">
          <ContractStatusBadge status={contract.status} />
          <ApprovalStatusBadge status={contract.approvalStatus} />
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex max-w-xs flex-wrap gap-2">
          <ContractDocumentLink
            href={`/dashboard/contracts/${contract.id}/agreement`}
            icon={<FileSignature className="h-3.5 w-3.5" />}
            label="Agreement"
            ready={Boolean(contract.agreement)}
            tone="sky"
          />
          <ContractDocumentLink
            href={`/dashboard/contracts/${contract.id}/work-order`}
            icon={<ClipboardList className="h-3.5 w-3.5" />}
            label="Work order"
            ready={Boolean(contract.workOrder)}
            tone="violet"
          />
        </div>
      </td>
      <td className="px-6 py-5 text-sm">
        <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
          <p>Start: {toNepaliDate(contract.startDate) ?? "-"}</p>
          <p className="text-muted-foreground">
            Target: {toNepaliDate(contract.intendedCompletionDate) ?? "-"}
          </p>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/contracts/${contract.id}`}>View Contract</Link>
        </Button>
      </td>
    </tr>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-[360px] rounded-[36px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[28px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.95fr]">
        <div className="space-y-6">
          <Skeleton className="h-[360px] rounded-[28px]" />
          <Skeleton className="h-[320px] rounded-[28px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[250px] rounded-[28px]" />
          <Skeleton className="h-[280px] rounded-[28px]" />
          <Skeleton className="h-[260px] rounded-[28px]" />
        </div>
      </div>
      <Skeleton className="h-[520px] rounded-[28px]" />
    </div>
  );
}

export default function CompanyViewPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: company, isLoading: isLoadingCompany, isError } = useCompany(id);
  const {
    data: companyContracts = [],
    isLoading: isLoadingContracts,
  } = useContracts({ companyId: id });

  const registrationRequestDate = formatDate(company?.registrationRequestDate);
  const registrationDate = formatDate(company?.registrationDate);
  const createdDate = formatDate(company?.createdAt);
  const updatedDate = formatDate(company?.updatedAt);

  const contractsByRecentUpdate = useMemo(
    () =>
      [...companyContracts].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
    [companyContracts]
  );

  if (isLoadingCompany || isLoadingContracts) {
    return <LoadingState />;
  }

  if (isError || !company) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 py-20 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-2xl font-semibold tracking-tight">Company not found</h2>
        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
          The company record could not be loaded. It may have been removed or is no
          longer available in the current dataset.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/companies">Return to companies</Link>
        </Button>
      </div>
    );
  }

  const contractCount = getCompanyContractCount(company, companyContracts.length);
  const isContracted = getCompanyIsContracted(company, companyContracts.length);
  const showCertificate = isApprovedStatus(company.approvalStatus);
  const uniqueProjectCount = Math.max(
    company._count?.projects ?? 0,
    new Set(companyContracts.map((contract) => contract.projectId)).size
  );
  const activeContracts = companyContracts.filter(
    (contract) => !["COMPLETED", "ARCHIVED"].includes(contract.status)
  ).length;
  const completedContracts = companyContracts.filter(
    (contract) => contract.status === "COMPLETED"
  ).length;
  const documentsReadyCount = companyContracts.filter(
    (contract) => contract.agreement && contract.workOrder
  ).length;
  const latestContract = contractsByRecentUpdate[0];
  const latestContractAmount = latestContract
    ? formatCurrency(latestContract.contractAmount)
    : null;
  const categoryStyle = CATEGORY_STYLES[company.category] ?? CATEGORY_STYLES.OTHER;
  const documentProgress = contractCount
    ? Math.round((documentsReadyCount / contractCount) * 100)
    : 0;
  const hasDirectContact = Boolean(company.phoneNumber || company.email);

  const workflowItems = [
    {
      complete: showCertificate,
      description: showCertificate
        ? "Certificate pages are unlocked for viewing and printing."
        : "Approve the company to enable certificate generation.",
      label: "Approval workflow",
    },
    {
      complete: hasDirectContact,
      description: hasDirectContact
        ? "Users can reach this company directly from the page."
        : "Add a phone number or email for faster coordination.",
      label: "Direct contact availability",
    },
    {
      complete: contractCount > 0,
      description:
        contractCount > 0
          ? `${contractCount} contract record${contractCount === 1 ? "" : "s"} linked to this profile.`
          : "Link the first contract to activate portfolio tracking.",
      label: "Contract portfolio",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <Button asChild variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-primary">
        <Link href="/dashboard/companies">
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.97)_48%,_rgba(239,246,255,0.98)_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.92)_0%,_rgba(15,23,42,0.96)_55%,_rgba(10,17,30,0.98)_100%)]">
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.6fr,1fr] lg:px-8 lg:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyle}`}
              >
                {company.category}
              </Badge>
              <ApprovalStatusBadge status={company.approvalStatus} />
              <Badge
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  isContracted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {isContracted ? "Contract engagement active" : "No active contract engagement"}
              </Badge>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="hidden rounded-[28px] border border-sky-200/70 bg-white/85 p-4 text-sky-700 shadow-sm sm:flex dark:border-sky-900 dark:bg-slate-950/40 dark:text-sky-300">
                  <Building2 className="h-9 w-9" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Company Workspace
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
                      {company.name}
                    </h1>
                  </div>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    A cleaner overview for registration status, contact details, and
                    live contract activity so the next document or action is always
                    easy to find.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <HeroDetailPill
                  icon={<MapPin className="h-4 w-4" />}
                  label="Registered Address"
                  value={company.address || "Address not provided"}
                />
                <HeroDetailPill
                  icon={<Receipt className="h-4 w-4" />}
                  label="PAN Number"
                  value={company.panNumber || "PAN not provided"}
                />
                <HeroDetailPill
                  href={company.phoneNumber ? `tel:${company.phoneNumber}` : undefined}
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Line"
                  value={company.phoneNumber || "Phone not added"}
                />
                <HeroDetailPill
                  href={company.email ? `mailto:${company.email}` : undefined}
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={company.email || "Email not added"}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/45">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Certificate
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {showCertificate ? "Ready to view and print" : "Unlocks after approval"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Approval status controls whether the official certificate is available.
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/45">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Latest Contract
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {latestContract?.contractNumber ?? "Not linked yet"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {latestContractAmount
                    ? `${latestContractAmount} recorded value`
                    : "No contract amount recorded yet."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/45">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Last Updated
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {updatedDate?.adShort ?? "N/A"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Profile changes and document refreshes are reflected here.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <SectionJumpLink
                href="#company-overview"
                icon={<Building2 className="h-4 w-4" />}
                label="Profile summary"
                description="Registration details, voucher info, and remarks."
              />
              <SectionJumpLink
                href="#contact-hub"
                icon={<User className="h-4 w-4" />}
                label="Contacts and status"
                description="Reach the company and check readiness at a glance."
              />
              <SectionJumpLink
                href="#contract-portfolio"
                icon={<ClipboardList className="h-4 w-4" />}
                label="Contract portfolio"
                description="Browse linked contracts without the cramped table view."
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Action Center
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  Manage profile and documents
                </h2>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <QuickActionLink
                href={`/dashboard/companies/${company.id}/edit`}
                icon={<Pencil className="h-4 w-4" />}
                label="Edit company profile"
                subtitle="Update registration fields, contacts, and internal notes."
              />
              <QuickActionLink
                disabled={!showCertificate}
                href={showCertificate ? `/dashboard/companies/${company.id}/certificate` : undefined}
                icon={<FileBadge className="h-4 w-4" />}
                label={showCertificate ? "Open certificate" : "Certificate pending approval"}
                subtitle={
                  showCertificate
                    ? "Open the printable approval certificate."
                    : "Approve the company to enable certificate generation."
                }
              />
              <QuickActionLink
                disabled={!latestContract}
                href={latestContract ? `/dashboard/contracts/${latestContract.id}` : undefined}
                icon={<ClipboardList className="h-4 w-4" />}
                label={latestContract ? "Open latest contract" : "Latest contract unavailable"}
                subtitle={
                  latestContract
                    ? "Jump to the most recently updated contract detail page."
                    : "Link a contract to unlock direct document access."
                }
              />
              <QuickActionLink
                disabled={contractCount === 0}
                href={contractCount > 0 ? "#contract-portfolio" : undefined}
                icon={<ShieldCheck className="h-4 w-4" />}
                label={contractCount > 0 ? "Review contract portfolio" : "Portfolio will appear here"}
                subtitle={
                  contractCount > 0
                    ? "Browse linked contracts in the improved responsive portfolio."
                    : "The contract portfolio activates after the first linked contract."
                }
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Document Pulse
                </p>
                <span className="text-sm font-semibold text-foreground">
                  {documentProgress}%
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width]"
                  style={{ width: `${documentProgress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Agreement + work order ready</span>
                <span className="font-semibold text-foreground">
                  {documentsReadyCount}/{contractCount || 0}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Agreement and work-order pages follow the live data inside each linked
                contract record.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Workflow Focus
              </p>
              {workflowItems.map((item) => (
                <WorkflowItem
                  key={item.label}
                  complete={item.complete}
                  description={item.description}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CompanyMetricCard
          title="Linked Projects"
          value={uniqueProjectCount}
          description="Unique projects currently tied to this company profile."
          tone="sky"
          icon={<Building2 className="h-5 w-5" />}
        />
        <CompanyMetricCard
          title="Active Contracts"
          value={activeContracts}
          description="Contracts that are still moving through agreement or execution."
          tone="emerald"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <CompanyMetricCard
          title="Completed"
          value={completedContracts}
          description="Contracts that already reached the completion milestone."
          tone="violet"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <CompanyMetricCard
          title="Documents Ready"
          value={documentsReadyCount}
          description="Contracts that already have both printable agreement and work order."
          tone="amber"
          icon={<FileSignature className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.95fr]">
        <div className="space-y-6">
          <section id="company-overview" className="scroll-mt-24">
            <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                <OverviewField
                  helper="Primary tax registration number used across company records."
                  icon={<Receipt className="h-4 w-4" />}
                  label="PAN / VAT Number"
                  mono
                  value={company.panNumber}
                />
                <OverviewField
                  helper="Internal voucher reference connected with registration paperwork."
                  icon={<FileBadge className="h-4 w-4" />}
                  label="Voucher Number"
                  value={company.voucherNo || "Not provided"}
                />
                <OverviewField
                  helper="Recorded approval date for the company registration."
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Registration Approved"
                  value={registrationDate?.bs ?? "N/A"}
                />
                <OverviewField
                  helper="Date when this company profile was first created in the system."
                  icon={<Calendar className="h-4 w-4" />}
                  label="Profile Created"
                  value={createdDate?.ad ?? "N/A"}
                />

                <div className="sm:col-span-2 rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/35">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Remarks / Notes
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {company.remarks || "No remarks have been added to this profile yet."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
            <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Registration Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <DateTimelineRow
                label="Registration Request Date"
                description="Date when the company first applied to be included in the approved registry."
                value={registrationRequestDate}
                tone="sky"
              />
              <DateTimelineRow
                label="Registration Approval Date"
                description="Date when the registration was approved and the company profile became active."
                value={registrationDate}
                tone="emerald"
              />
              <DateTimelineRow
                label="Profile Last Updated"
                description="Most recent system update for the company record and linked document state."
                value={updatedDate}
                tone="slate"
              />
            </CardContent>
          </Card>
        </div>

        <section id="contact-hub" className="scroll-mt-24 xl:sticky xl:top-6 xl:self-start">
          <div className="space-y-6">
            <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <ContactRow
                  icon={<User className="h-4 w-4" />}
                  label="Contact Person"
                  note="Primary person listed for registration and coordination."
                  value={company.contactPerson || "Not provided"}
                />
                <ContactRow
                  href={company.phoneNumber ? `tel:${company.phoneNumber}` : undefined}
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                  note={
                    company.phoneNumber
                      ? "Tap to place a call from supported devices."
                      : "Add a phone number to enable direct calling."
                  }
                  value={company.phoneNumber || "N/A"}
                />
                <ContactRow
                  href={company.email ? `mailto:${company.email}` : undefined}
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  note={
                    company.email
                      ? "Tap to draft an email in your default mail app."
                      : "Add an email address for written follow-up."
                  }
                  value={company.email || "N/A"}
                />
                <ContactRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Registered Address"
                  note="Address recorded in the company registration profile."
                  value={company.address || "Not provided"}
                />
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <StatusRow
                  description={
                    company.panVerified
                      ? "Tax registration details have already been verified."
                      : "Tax registration details are still waiting for verification."
                  }
                  label="PAN verified"
                  status={company.panVerified ? "verified" : "pending"}
                />
                <StatusRow
                  description={
                    isContracted
                      ? "This company is already tied to live contract activity."
                      : "No active contract engagement is currently linked."
                  }
                  label="Contract engagement"
                  status={isContracted ? "active" : "none"}
                />
                <StatusRow
                  description={
                    showCertificate
                      ? "The printable approval certificate is available right now."
                      : "The certificate stays locked until approval is completed."
                  }
                  label="Printable certificate"
                  status={showCertificate ? "ready" : "locked"}
                />
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="font-semibold text-foreground">Latest document sync</p>
                  <p className="mt-2 leading-6 text-muted-foreground">
                    {latestContract
                      ? `Agreement and work-order pages follow the live data from contract ${latestContract.contractNumber}.`
                      : "Document pages will become available as soon as the first contract is linked."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSignature className="h-5 w-5 text-primary" />
                  Latest Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                {latestContract ? (
                  <>
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Most Recent Contract
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {latestContract.contractNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {latestContract.project?.name ?? "Project not linked"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated {formatDate(latestContract.updatedAt)?.adShort ?? "N/A"}
                      </p>
                    </div>

                    <QuickActionLink
                      href={`/dashboard/contracts/${latestContract.id}/agreement`}
                      icon={<FileSignature className="h-4 w-4" />}
                      label="Open agreement page"
                      subtitle="View the dynamic Nepali agreement document."
                    />

                    <QuickActionLink
                      href={`/dashboard/contracts/${latestContract.id}/work-order`}
                      icon={<ClipboardList className="h-4 w-4" />}
                      label="Open work-order page"
                      subtitle="View the dynamic Nepali work-order document."
                    />
                  </>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm leading-6 text-muted-foreground dark:border-slate-800 dark:bg-slate-900/40">
                    No contract documents are available yet. Link a contract to this
                    company to generate agreement and work-order pages automatically.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <section id="contract-portfolio" className="scroll-mt-24">
        <Card className="gap-0 overflow-hidden rounded-[28px] border-slate-200 py-0 shadow-sm dark:border-slate-800">
          <CardHeader className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Contract Portfolio
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Linked contracts are shown in a responsive layout so they stay easy
                  to browse on both narrow and wide screens.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {contractCount} total contracts
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {documentsReadyCount} document-ready
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {contractsByRecentUpdate.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-4 text-base font-semibold text-foreground">
                  No contracts are linked to this company yet.
                </p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Once a contract is linked, this section will surface its current
                  status, document links, and execution timeline in one place.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 p-4 xl:hidden xl:p-6">
                  {contractsByRecentUpdate.map((contract) => (
                    <ContractPortfolioCard key={contract.id} contract={contract} />
                  ))}
                </div>

                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[980px]">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/40">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Contract
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Project
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Documents
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Timeline
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractsByRecentUpdate.map((contract) => (
                        <ContractRow key={contract.id} contract={contract} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

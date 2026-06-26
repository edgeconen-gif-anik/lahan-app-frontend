"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  BookOpen,
  Droplets,
  FileText,
  Fuel,
  Pencil,
  Plus,
  Printer,
  Search,
  Ticket,
  Trash2,
  XCircle,
} from "lucide-react";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { Button } from "@/components/ui/button";
import {
  FUEL_SOURCE_LABEL,
  FUEL_TYPE_LABEL,
  FuelLog,
  FuelLogSource,
  FuelType,
} from "@/lib/schema/fuel/fuel";
import { toNepaliDate } from "@/lib/date-utils";
import {
  useApproveFuelLog,
  useDeleteFuelLog,
  useFuelLogs,
  useRejectFuelLog,
} from "@/hooks/fuel/useFuelLogs";

type ApprovalFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type SourceFilter = "ALL" | FuelLogSource;
type TypeFilter = "ALL" | FuelType;

function getUserLabel(user?: { name?: string | null; email?: string | null }) {
  return user?.name || user?.email || "Unknown user";
}

function formatCurrency(value?: number | null) {
  if (value == null) return "-";
  return `Rs. ${Number(value).toLocaleString()}`;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

function FuelRow({
  fuelLog,
  isAdmin,
  isReviewing,
  isDeleting,
  onApprove,
  onReject,
  onDelete,
}: {
  fuelLog: FuelLog;
  isAdmin: boolean;
  isReviewing: boolean;
  isDeleting: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const canEdit = isAdmin || fuelLog.approvalStatus !== "APPROVED";

  return (
    <tr className="border-b align-top">
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="font-semibold">{getUserLabel(fuelLog.user)}</div>
          <div className="text-xs text-muted-foreground">
            Submitted by {getUserLabel(fuelLog.requestedBy)}
          </div>
          <div className="text-xs text-muted-foreground">
            {toNepaliDate(fuelLog.logDate) ??
              new Date(fuelLog.logDate).toLocaleDateString()}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {FUEL_SOURCE_LABEL[fuelLog.source]}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {FUEL_TYPE_LABEL[fuelLog.fuelType]}
            </span>
          </div>
          <p className="max-w-md text-sm leading-6">{fuelLog.purpose}</p>
          {fuelLog.remarks ? (
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              {fuelLog.remarks}
            </p>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Qty:</span>{" "}
            <span className="font-semibold">{fuelLog.quantityLiters} L</span>
          </div>
          <div>
            <span className="text-muted-foreground">Rate:</span>{" "}
            {formatCurrency(fuelLog.ratePerLiter)}
          </div>
          <div>
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-semibold">
              {formatCurrency(fuelLog.totalAmount)}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="space-y-1 text-sm">
          <div>{fuelLog.project?.name ?? "No project"}</div>
          <div className="text-xs text-muted-foreground">
            {fuelLog.contract?.contractNumber ?? "No contract"}
          </div>
          <div className="text-xs text-muted-foreground">
            {fuelLog.vehicleNumber || "No vehicle"}{" "}
            {fuelLog.odometerReading ? `- ${fuelLog.odometerReading} km` : ""}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <ApprovalStatusBadge status={fuelLog.approvalStatus} />
        {fuelLog.approvedBy ? (
          <p className="mt-2 text-xs text-muted-foreground">
            By {getUserLabel(fuelLog.approvedBy)}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          {isAdmin && fuelLog.approvalStatus === "PENDING" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isReviewing}
                onClick={onApprove}
                className="gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isReviewing}
                onClick={onReject}
                className="gap-1 text-red-600"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          ) : null}
          {canEdit ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={`/dashboard/fuel/${fuelLog.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/dashboard/fuel/${fuelLog.id}/demand-form`}>
              <FileText className="h-4 w-4" />
              माग फारम
            </Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/dashboard/fuel/${fuelLog.id}/log-book`}>
              <BookOpen className="h-4 w-4" />
              Log Book
            </Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/dashboard/fuel/${fuelLog.id}/fuel-coupon`}>
              <Ticket className="h-4 w-4" />
              Coupon
            </Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/dashboard/fuel/${fuelLog.id}/print`}>
              <Printer className="h-4 w-4" />
              All
            </Link>
          </Button>
          {isAdmin ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isDeleting}
              onClick={onDelete}
              className="gap-1 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export default function FuelLogsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading } = useFuelLogs({
    page,
    limit,
    search: search || undefined,
    approvalStatus: approvalFilter === "ALL" ? undefined : approvalFilter,
    source: sourceFilter === "ALL" ? undefined : sourceFilter,
    fuelType: typeFilter === "ALL" ? undefined : typeFilter,
    sortBy: "logDate",
    sortOrder: "desc",
  });
  const { mutate: approveFuelLog, isPending: isApproving } =
    useApproveFuelLog();
  const { mutate: rejectFuelLog, isPending: isRejecting } = useRejectFuelLog();
  const { mutate: deleteFuelLog, isPending: isDeleting } = useDeleteFuelLog();
  const fuelLogs = useMemo(() => data?.data ?? [], [data?.data]);
  const isReviewing = isApproving || isRejecting;

  const totals = useMemo(() => {
    return fuelLogs.reduce(
      (acc, fuelLog) => {
        acc.liters += fuelLog.quantityLiters;
        acc.amount += fuelLog.totalAmount ?? 0;
        if (fuelLog.approvalStatus === "PENDING") acc.pending += 1;
        return acc;
      },
      { liters: 0, amount: 0, pending: 0 },
    );
  }, [fuelLogs]);

  const handleApprove = (fuelLog: FuelLog) => {
    approveFuelLog({ id: fuelLog.id });
  };

  const handleReject = (fuelLog: FuelLog) => {
    const remarks = window.prompt(
      "Reason for rejection",
      fuelLog.remarks ?? "",
    );
    if (remarks === null) return;
    rejectFuelLog({ id: fuelLog.id, remarks });
  };

  const handleDelete = (fuelLog: FuelLog) => {
    if (!window.confirm("Delete this fuel log permanently?")) return;
    deleteFuelLog(fuelLog.id);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Fuel className="h-7 w-7 text-primary" />
            Fuel Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track fuel requests, logbook entries, app entries, and admin
            approval.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/fuel/new">
            <Plus className="h-4 w-4" />
            New Fuel Log
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Loaded Logs"
          value={fuelLogs.length}
          detail={`Total matching records: ${data?.meta.total ?? 0}`}
        />
        <StatCard
          label="Pending"
          value={totals.pending}
          detail={isAdmin ? "Waiting for admin action" : "Waiting for approval"}
        />
        <StatCard
          label="Fuel Quantity"
          value={`${totals.liters.toLocaleString()} L`}
          detail="Visible page total"
        />
        <StatCard
          label="Fuel Amount"
          value={formatCurrency(totals.amount)}
          detail="Visible page total"
        />
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1fr),170px,160px,150px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search purpose, vehicle, user, project, or contract"
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <select
          value={approvalFilter}
          onChange={(event) => {
            setApprovalFilter(event.target.value as ApprovalFilter);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(event) => {
            setSourceFilter(event.target.value as SourceFilter);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All Sources</option>
          {Object.entries(FUEL_SOURCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value as TypeFilter);
            setPage(1);
          }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="ALL">All Fuel</option>
          {Object.entries(FUEL_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User / Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Source / Purpose
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fuel
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Project / Vehicle
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Approval
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading fuel logs...
                  </td>
                </tr>
              ) : fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                      <Droplets className="h-8 w-8" />
                      <p>No fuel logs match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                fuelLogs.map((fuelLog) => (
                  <FuelRow
                    key={fuelLog.id}
                    fuelLog={fuelLog}
                    isAdmin={Boolean(isAdmin)}
                    isReviewing={isReviewing}
                    isDeleting={isDeleting}
                    onApprove={() => handleApprove(fuelLog)}
                    onReject={() => handleReject(fuelLog)}
                    onDelete={() => handleDelete(fuelLog)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {data?.meta.page ?? page} of {data?.meta.lastPage ?? 1}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= (data?.meta.lastPage ?? 1)}
              onClick={() =>
                setPage((current) =>
                  Math.min(data?.meta.lastPage ?? current, current + 1),
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

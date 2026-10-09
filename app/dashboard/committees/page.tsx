"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Phone,
  Plus,
  Users,
} from "lucide-react";

import { ApprovalStatusBadge } from "@/components/approval-status-badge";
import { BulkActionBar } from "@/components/data/bulk-action-bar";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FilterBar } from "@/components/data/filter-bar";
import { FilterChips } from "@/components/data/filter-chips";
import { Pagination } from "@/components/data/pagination";
import { RowActions, type RowAction } from "@/components/data/row-actions";
import { SearchInput } from "@/components/data/search-input";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RegistrationInitiatorCell } from "@/components/registration-initiator-cell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBulkApproveUserCommittees,
  useUserCommittees,
} from "@/hooks/user-committee/useUserCommittees";
import { useRole } from "@/lib/auth/use-role";
import { useEffectiveFiscalYear } from "@/lib/fiscal-year-context";
import type { ApprovalStatus } from "@/lib/schema/approval";
import { useUrlParams } from "@/lib/use-url-params";
import { cn } from "@/lib/utils";
import type {
  CommitteeOfficial,
  UserCommitteeRecord,
} from "@/services/user-committe/userCommittee.service";

type Approval = "ALL" | ApprovalStatus;

const DEFAULT_LIMIT = 20;
const APPROVALS: Approval[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function OfficialCell({
  officials,
  role,
}: {
  officials: CommitteeOfficial[];
  role: CommitteeOfficial["role"];
}) {
  const official = officials?.find((item) => item.role === role);
  if (!official) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{official.name}</span>
      <span className="text-xs text-muted-foreground">{official.phoneNumber}</span>
    </div>
  );
}

function CommitteesLoadingFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function CommitteeListContent() {
  const { isAdmin } = useRole();
  const fiscalYear = useEffectiveFiscalYear();
  const { get, getInt, update, clear } = useUrlParams();

  const search = get("q");
  const approvalParam = get("view") as Approval;
  const approval: Approval = APPROVALS.includes(approvalParam) ? approvalParam : "ALL";
  const page = getInt("page", 1);
  const limit = getInt("limit", DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError, refetch } = useUserCommittees({
    search: search || undefined,
    fiscalYear: fiscalYear || undefined,
    approvalStatus: approval === "ALL" ? undefined : approval,
    page,
    limit,
  });
  const committees = data?.data ?? [];
  const counts = data?.counts;
  const meta = data?.meta;

  const { mutate: bulkApprove, isPending: isBulkApproving } =
    useBulkApproveUserCommittees();

  // Selection is tied to the current page/filters and drops on any change.
  const scopeKey = JSON.stringify([search, fiscalYear, approval, page, limit]);
  const [selection, setSelection] = useState<{ scope: string; ids: Set<string> }>({
    scope: scopeKey,
    ids: new Set(),
  });
  const selectedIds = selection.scope === scopeKey ? selection.ids : new Set<string>();
  const selectedPending = committees.filter(
    (committee) =>
      selectedIds.has(committee.id) && committee.approvalStatus !== "APPROVED",
  );

  const hasActiveFilters = Boolean(search || approval !== "ALL");
  const resetFilters = () => clear(["q", "view"]);

  const buildActions = (committee: UserCommitteeRecord): RowAction[] => [
    { label: "View", icon: Eye, href: `/dashboard/committees/${committee.id}` },
    {
      label: "Contacts",
      icon: Phone,
      href: `/dashboard/committees/${committee.id}#official-contacts`,
    },
    {
      label: "Approve",
      icon: CheckCircle2,
      onSelect: () => bulkApprove([committee.id]),
      hidden: !isAdmin || committee.approvalStatus === "APPROVED",
      disabled: isBulkApproving,
    },
  ];

  const columns: DataTableColumn<UserCommitteeRecord>[] = [
    {
      id: "index",
      header: "#",
      className: "w-12 text-muted-foreground",
      cell: (_committee, index) => (page - 1) * limit + index + 1,
    },
    {
      id: "name",
      header: "Committee",
      cell: (committee) => (
        <div className="space-y-1">
          <Link
            href={`/dashboard/committees/${committee.id}`}
            className="font-semibold text-primary hover:underline"
          >
            {committee.name}
          </Link>
          <div className="text-sm text-muted-foreground">{committee.address}</div>
        </div>
      ),
    },
    {
      id: "president",
      header: "President",
      cell: (committee) => (
        <OfficialCell officials={committee.officials} role="PRESIDENT" />
      ),
    },
    {
      id: "secretary",
      header: "Secretary",
      cell: (committee) => (
        <OfficialCell officials={committee.officials} role="SECRETARY" />
      ),
    },
    {
      id: "treasurer",
      header: "Treasurer",
      cell: (committee) => (
        <OfficialCell officials={committee.officials} role="TREASURER" />
      ),
    },
    {
      id: "formed",
      header: "Formed",
      cell: (committee) => new Date(committee.formedDate).toLocaleDateString(),
    },
    { id: "bank", header: "Bank", cell: (committee) => committee.bankName },
    {
      id: "account",
      header: "Account no.",
      cell: (committee) => (
        <span className="font-mono text-sm">{committee.accountNumber}</span>
      ),
    },
    {
      id: "initiator",
      header: "Initiator",
      cell: (committee) => (
        <RegistrationInitiatorCell initiator={committee.initiatedBy} />
      ),
    },
    {
      id: "approval",
      header: "Approval",
      cell: (committee) => <ApprovalStatusBadge status={committee.approvalStatus} />,
    },
  ];

  const renderMobileCard = (committee: UserCommitteeRecord) => {
    const president = committee.officials?.find((item) => item.role === "PRESIDENT");

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/dashboard/committees/${committee.id}`}
              className="font-semibold text-primary hover:underline"
            >
              {committee.name}
            </Link>
            <p className="text-sm text-muted-foreground">{committee.address}</p>
          </div>
          <RowActions actions={buildActions(committee)} label={committee.name} />
        </div>
        <ApprovalStatusBadge status={committee.approvalStatus} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">President</dt>
          <dd className="text-right">{president?.name ?? "-"}</dd>
          <dt className="text-muted-foreground">Bank</dt>
          <dd className="text-right">{committee.bankName}</dd>
          <dt className="text-muted-foreground">Fiscal year</dt>
          <dd className="text-right">{committee.fiscalYear}</dd>
        </dl>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Committees"
        description="Manage committee registrations and send new entries for admin approval."
        actions={
          <Button asChild>
            <Link href="/dashboard/committees/new">
              <Plus />
              Register Committee
            </Link>
          </Button>
        }
      />

      <FilterChips
        label="Approval status"
        value={approval}
        onChange={(next) => update({ view: next === "ALL" ? null : next })}
        options={[
          { value: "ALL", label: "All committees", count: counts?.total },
          ...(isAdmin
            ? [
                {
                  value: "PENDING",
                  label: "Needs approval",
                  count: counts?.PENDING,
                  tone: "warning" as const,
                },
              ]
            : []),
          { value: "APPROVED", label: "Approved", count: counts?.APPROVED },
          { value: "REJECTED", label: "Rejected", count: counts?.REJECTED },
        ]}
      />

      <FilterBar hasActiveFilters={hasActiveFilters} onReset={resetFilters}>
        <SearchInput
          label="Search committees"
          placeholder="Search by committee name, address or official"
          value={search}
          onChange={(value) => update({ q: value })}
          className="w-full md:w-96"
        />
      </FilterBar>

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
          <p className="font-medium text-destructive">Committees could not be loaded.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {isAdmin ? (
            <BulkActionBar
              count={selectedIds.size}
              onClear={() => setSelection({ scope: scopeKey, ids: new Set() })}
            >
              <Button
                type="button"
                size="sm"
                disabled={selectedPending.length === 0 || isBulkApproving}
                onClick={() => {
                  bulkApprove(selectedPending.map((committee) => committee.id));
                  setSelection({ scope: scopeKey, ids: new Set() });
                }}
              >
                <CheckCircle2 />
                Approve{selectedPending.length > 0 ? ` (${selectedPending.length})` : ""}
              </Button>
            </BulkActionBar>
          ) : null}

          <div
            className={cn(
              "overflow-hidden rounded-xl border shadow-sm transition-opacity",
              isFetching && !isLoading && "opacity-70",
            )}
          >
            <DataTable
              columns={columns}
              rows={committees}
              getRowId={(committee) => committee.id}
              isLoading={isLoading}
              minWidth={1300}
              renderMobileCard={renderMobileCard}
              rowActions={(committee) => (
                <RowActions actions={buildActions(committee)} label={committee.name} />
              )}
              selection={
                isAdmin
                  ? {
                      selectedIds,
                      onChange: (ids) => setSelection({ scope: scopeKey, ids }),
                    }
                  : undefined
              }
              empty={
                <EmptyState
                  icon={Users}
                  title={hasActiveFilters ? "No committees match these filters" : "No committees registered yet"}
                  description={
                    hasActiveFilters
                      ? "Try clearing the search or choosing another fiscal year."
                      : "Register the first user committee for this fiscal year."
                  }
                  action={
                    hasActiveFilters ? (
                      <Button size="sm" variant="outline" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/dashboard/committees/new">
                          <Plus />
                          Register Committee
                        </Link>
                      </Button>
                    )
                  }
                />
              }
            />
            {meta ? (
              <Pagination
                page={meta.page}
                lastPage={meta.lastPage}
                total={meta.total}
                limit={limit}
                onPageChange={(next) => update({ page: next })}
                onLimitChange={(next) =>
                  update({ limit: next === DEFAULT_LIMIT ? null : next })
                }
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommitteeLandingPage() {
  return (
    <Suspense fallback={<CommitteesLoadingFallback />}>
      <CommitteeListContent />
    </Suspense>
  );
}

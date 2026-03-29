"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useCompanies,
  useDeleteCompany,
  useApproveCompany,
} from "@/hooks/company/useCompany";
import { useContracts } from "@/hooks/contract/useContracts";
import {
  CompanyCategoryEnum,
  getCompanyIsContracted,
} from "@/lib/schema/company.schema";
import { isApprovedStatus } from "@/lib/schema/approval";
import { ApprovalStatusBadge } from "@/components/approval-status-badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  Plus,
  MoreHorizontal,
  FileBadge,
  Pencil,
  Phone,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function CompanyListPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const { data: contracts = [], isLoading: isLoadingContracts } = useContracts();
  const { mutate: deleteCompany } = useDeleteCompany();
  const { mutate: approveCompany, isPending: isApprovingCompany } = useApproveCompany();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [contractFilter, setContractFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-desc");

  const [companyToDelete, setCompanyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const contractCountsByCompany = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      if (!isApprovedStatus(contract.approvalStatus)) return;
      if (!contract.companyId) return;
      counts.set(contract.companyId, (counts.get(contract.companyId) ?? 0) + 1);
    });

    return counts;
  }, [contracts]);

  const isLoading = isLoadingCompanies || isLoadingContracts;
  const isCompanyContracted = (company: (typeof companies)[number]) =>
    getCompanyIsContracted(company, contractCountsByCompany.get(company.id) ?? 0);

  /* ------------------ Stats ------------------ */

  const totalCompanies = companies.length;
  const pendingCompanies = companies.filter(
    (company) => company.approvalStatus === "PENDING"
  ).length;

  const contractedCompanies = companies.filter(
    (company) =>
      isApprovedStatus(company.approvalStatus) && isCompanyContracted(company)
  ).length;

  const nonContractedCompanies = companies.filter(
    (company) =>
      isApprovedStatus(company.approvalStatus) && !isCompanyContracted(company)
  ).length;

  /* ------------------ Filter + Sort ------------------ */

  const filteredCompanies = useMemo(() => {
    return companies
      .filter((company) => {
        const matchesSearch =
          company?.name?.toLowerCase().includes(search.toLowerCase()) ||
          String(company?.panNumber || "").includes(search);

        const matchesCategory =
          categoryFilter === "ALL" ||
          company.category === categoryFilter;

        const matchesContract =
          contractFilter === "ALL" ||
          (contractFilter === "CONTRACTED" &&
            getCompanyIsContracted(company, contractCountsByCompany.get(company.id) ?? 0)) ||
          (contractFilter === "NON_CONTRACTED" &&
            !getCompanyIsContracted(company, contractCountsByCompany.get(company.id) ?? 0));

        return matchesSearch && matchesCategory && matchesContract;
      })
      .sort((a, b) => {
        if (sortBy === "name")
          return (a.name || "").localeCompare(b.name || "");

        const dateA = a.registrationRequestDate
          ? new Date(a.registrationRequestDate).getTime()
          : 0;

        const dateB = b.registrationRequestDate
          ? new Date(b.registrationRequestDate).getTime()
          : 0;

        if (sortBy === "date-desc") return dateB - dateA;
        if (sortBy === "date-asc") return dateA - dateB;

        return 0;
      });
  }, [companies, search, categoryFilter, contractFilter, sortBy, contractCountsByCompany]);

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">
            Manage contractors and suppliers registry.
          </p>
        </div>

        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register Company
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}

      <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>

        <div className="p-4 rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Companies</p>
          <p className="text-2xl font-bold">{totalCompanies}</p>
        </div>

        {isAdmin && (
          <div className="p-4 rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-600">
              {pendingCompanies}
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
          <p className="text-sm text-muted-foreground">Contracted</p>
          <p className="text-2xl font-bold text-green-600">
            {contractedCompanies}
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
          <p className="text-sm text-muted-foreground">Non Contracted</p>
          <p className="text-2xl font-bold text-orange-600">
            {nonContractedCompanies}
          </p>
        </div>

      </div>

      {/* Filters */}

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-950 p-4 rounded-lg border shadow-sm">

        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search by Name or PAN..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>

            {CompanyCategoryEnum.options.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={contractFilter} onValueChange={setContractFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Contract Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="CONTRACTED">Contracted</SelectItem>
            <SelectItem value="NON_CONTRACTED">Non Contracted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}

      <div className="rounded-md border bg-white dark:bg-gray-950 shadow-sm">
        <Table>

          <TableHeader>
            <TableRow>
              <TableHead className="w-16">S.No</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>PAN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>

            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company, index) => (
                <TableRow key={company.id}>

                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>

                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/companies/${company.id}`}
                      className="hover:underline text-primary"
                    >
                      {company.name}
                    </Link>
                  </TableCell>

                  <TableCell>{company.panNumber}</TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {company.category}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-2 items-start">
                      <ApprovalStatusBadge status={company.approvalStatus} />
                      {isApprovedStatus(company.approvalStatus) ? (
                        isCompanyContracted(company) ? (
                          <Badge className="bg-green-100 text-green-700">
                            Contracted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Not Contracted
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline">
                          Hidden from general users
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {company.contactPerson || "N/A"}
                      </span>

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {company.phoneNumber || "N/A"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">

                    <DropdownMenu>

                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">

                        <Link href={`/dashboard/companies/${company.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                        </Link>

                        <Link href={`/dashboard/companies/${company.id}/certificate`}>
                          <DropdownMenuItem>
                            <FileBadge className="mr-2 h-4 w-4" />
                            Certificate
                          </DropdownMenuItem>
                        </Link>

                        <Link href={`/dashboard/companies/${company.id}/edit`}>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>

                        {isAdmin && company.approvalStatus !== "APPROVED" && (
                          <DropdownMenuItem
                            disabled={isApprovingCompany}
                            onClick={() => approveCompany(company.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}

                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() =>
                              setCompanyToDelete({
                                id: company.id,
                                name: company.name
                              })
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}

                      </DropdownMenuContent>

                    </DropdownMenu>

                  </TableCell>

                </TableRow>
              ))
            )}

          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}

      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
      >

        <AlertDialogContent>

          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Company?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete
              <strong> {companyToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (companyToDelete) {
                  deleteCompany(companyToDelete.id);
                  setCompanyToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  );
}

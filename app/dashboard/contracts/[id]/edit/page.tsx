"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { useContract, useUpdateContract } from "@/hooks/contract/useContracts";
import { useProjects } from "@/hooks/project/useProjects";
import { useCompanies } from "@/hooks/company/useCompany";
import { useUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { useUsers } from "@/hooks/user/useUsers";
import { toAdDate, toNepaliDate } from "@/lib/date-utils";
import type { UpdateContractPayload } from "@/lib/schema/contract/contract";

type MutationError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

type Option = {
  value: string;
  label: string;
  searchText?: string;
  sublabel?: string;
};

interface EditFormState {
  contractNumber: string;
  contractAmount: number | "";
  startDate: string;
  intendedCompletionDate: string;
  actualCompletionDate: string;
  projectId: string;
  companyId: string;
  userCommitteeId: string;
  userID: string;
  siteInchargeId: string;
  remarks: string;
}

const BS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as MutationError)?.response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : message ?? fallback;
}

function extractList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "object" && raw !== null) {
    const value = raw as { data?: T[]; results?: T[] };
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.results)) return value.results;
  }
  return [];
}

function addMissingOption(options: Option[], option?: Option | null) {
  if (!option?.value) return options;
  return options.some((item) => item.value === option.value)
    ? options
    : [option, ...options];
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function optionMatchesSearch(option: Option, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return [option.label, option.sublabel, option.searchText, option.value]
    .filter(Boolean)
    .some((part) => {
      const text = part!;
      return (
        text.toLowerCase().includes(query.toLowerCase()) ||
        normalizeSearchText(text).includes(normalizedQuery)
      );
    });
}

function formatBsDateInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);
  if (digitsOnly.length <= 4) return digitsOnly;
  if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
}

function toBsDateInput(value: string | null | undefined) {
  const bsDate = toNepaliDate(value);
  return bsDate === "N/A" || bsDate === "Invalid Date" ? "" : bsDate;
}

function toAmountInput(value: number | string | null | undefined): number | "" {
  if (value == null || value === "") return "";
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : "";
}

function convertBsDate(value: string, fieldLabel: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!BS_DATE_PATTERN.test(trimmed)) {
    throw new Error(`${fieldLabel} must be in BS format YYYY-MM-DD.`);
  }

  const adDate = toAdDate(trimmed);
  if (!adDate) throw new Error(`${fieldLabel} is not a valid BS date.`);
  return adDate.toISOString();
}

function buildPayload(form: EditFormState): UpdateContractPayload {
  const contractAmount =
    form.contractAmount !== "" && Number.isFinite(Number(form.contractAmount))
      ? Number(form.contractAmount)
      : undefined;

  return {
    contractNumber: form.contractNumber.trim() || undefined,
    contractAmount,
    startDate: convertBsDate(form.startDate, "Start date"),
    intendedCompletionDate: convertBsDate(
      form.intendedCompletionDate,
      "Intended completion date"
    ),
    actualCompletionDate: convertBsDate(form.actualCompletionDate, "Actual completion date"),
    projectId: form.projectId || undefined,
    companyId: form.companyId || undefined,
    userCommitteeId: form.userCommitteeId || undefined,
    userID: form.userID || undefined,
    siteInchargeId: form.siteInchargeId || undefined,
    remarks: form.remarks.trim() || undefined,
  };
}

function Field({
  children,
  label,
  required,
  hint,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FriendlySelect({
  disabled,
  isLoading,
  name,
  onSearchChange,
  options,
  placeholder,
  required,
  searchPlaceholder,
  searchValue,
  value,
  onChange,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  name: keyof EditFormState;
  onSearchChange?: (value: string) => void;
  options: Option[];
  placeholder: string;
  required?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  value: string;
  onChange: (name: keyof EditFormState, value: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const search = searchValue ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => optionMatchesSearch(option, query));
  }, [options, search]);

  const shouldShowResults = isFocused || Boolean(search);

  const handleSelect = (nextValue: string) => {
    onChange(name, nextValue);
    setSearch("");
    setIsFocused(false);
  };

  return (
    <div className="space-y-2">
      <input
        type="search"
        disabled={disabled}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        placeholder={searchPlaceholder ?? `Search ${placeholder.toLowerCase()}...`}
        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-muted"
      />
      <select
        name={name}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-muted"
      >
        <option value="">{isLoading ? "Loading..." : placeholder}</option>
        {selectedOption && !filteredOptions.some((option) => option.value === value) && (
          <option value={selectedOption.value}>
            {selectedOption.sublabel
              ? `${selectedOption.label} - ${selectedOption.sublabel}`
              : selectedOption.label}
          </option>
        )}
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.sublabel ? `${option.label} - ${option.sublabel}` : option.label}
          </option>
        ))}
      </select>
      {selectedOption && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selectedOption.label}</span>
          {selectedOption.sublabel ? ` - ${selectedOption.sublabel}` : ""}
        </p>
      )}
      {shouldShowResults && !disabled && (
        <div className="max-h-56 overflow-y-auto rounded-md border bg-background shadow-sm">
          {isLoading ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">Loading...</div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 25).map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option.value)}
                className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="block font-medium text-foreground">{option.label}</span>
                {option.sublabel && (
                  <span className="block text-xs text-muted-foreground">{option.sublabel}</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matching records found.
            </div>
          )}
        </div>
      )}
      {search && !isLoading && filteredOptions.length === 0 && !shouldShowResults && (
        <p className="text-xs text-muted-foreground">No matching records found.</p>
      )}
    </div>
  );
}

function BsDateInput({
  name,
  required,
  value,
  onChange,
}: {
  name: keyof EditFormState;
  required?: boolean;
  value: string;
  onChange: (name: keyof EditFormState, value: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      required={required}
      value={value}
      onChange={(event) => onChange(name, formatBsDateInput(event.target.value))}
      placeholder="2082-01-15"
      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
    />
  );
}

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const { data: contract, isLoading, isError } = useContract(contractId);
  const { mutateAsync: updateContract, isPending: isUpdating } = useUpdateContract();

  const [projectSearch, setProjectSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [committeeSearch, setCommitteeSearch] = useState("");
  const [siteInchargeSearch, setSiteInchargeSearch] = useState("");
  const [representativeSearch, setRepresentativeSearch] = useState("");
  const debouncedProjectSearch = useDebounce(projectSearch);
  const debouncedCompanySearch = useDebounce(companySearch);
  const debouncedCommitteeSearch = useDebounce(committeeSearch);
  const debouncedSiteInchargeSearch = useDebounce(siteInchargeSearch);
  const debouncedRepresentativeSearch = useDebounce(representativeSearch);

  const { data: baseProjectsRaw, isLoading: isLoadingBaseProjects } = useProjects({
    limit: 200,
  });
  const { data: searchedProjectsRaw, isLoading: isLoadingSearchedProjects } = useProjects({
    enabled: Boolean(debouncedProjectSearch),
    limit: 200,
    search: debouncedProjectSearch,
  });
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies({
    limit: 200,
    search: debouncedCompanySearch || undefined,
  });
  const { data: committeesRaw, isLoading: isLoadingCommittees } = useUserCommittees({
    limit: 200,
    search: debouncedCommitteeSearch || undefined,
  });
  const { data: siteInchargesRaw, isLoading: isLoadingSiteIncharges } = useUsers({
    limit: 200,
    search: debouncedSiteInchargeSearch || undefined,
  });
  const { data: representativesRaw, isLoading: isLoadingRepresentatives } = useUsers({
    limit: 200,
    search: debouncedRepresentativeSearch || undefined,
  });
  const isLoadingProjects =
    isLoadingBaseProjects || (Boolean(debouncedProjectSearch) && isLoadingSearchedProjects);

  const [formData, setFormData] = useState<EditFormState>({
    contractNumber: "",
    contractAmount: "",
    startDate: "",
    intendedCompletionDate: "",
    actualCompletionDate: "",
    projectId: "",
    companyId: "",
    userCommitteeId: "",
    userID: "",
    siteInchargeId: "",
    remarks: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!contract) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      contractNumber: contract.contractNumber ?? "",
      contractAmount: toAmountInput(contract.contractAmount),
      startDate: toBsDateInput(contract.startDate),
      intendedCompletionDate: toBsDateInput(contract.intendedCompletionDate),
      actualCompletionDate: toBsDateInput(contract.actualCompletionDate),
      projectId: contract.projectId ?? "",
      companyId: contract.companyId ?? "",
      userCommitteeId: contract.userCommitteeId ?? "",
      userID: contract.userID ?? "",
      siteInchargeId: contract.siteInchargeId ?? contract.project?.siteIncharge?.id ?? "",
      remarks: contract.remarks ?? "",
    });
  }, [contract]);

  const projectOptions = useMemo(() => {
    const projectsById = new Map<string, {
      id: string;
      name: string;
      sNo?: string | null;
      fiscalYear?: string | null;
    }>();

    for (const project of [
      ...extractList<{
        id: string;
        name: string;
        sNo?: string | null;
        fiscalYear?: string | null;
      }>(baseProjectsRaw),
      ...extractList<{
        id: string;
        name: string;
        sNo?: string | null;
        fiscalYear?: string | null;
      }>(searchedProjectsRaw),
    ]) {
      projectsById.set(project.id, project);
    }

    const options = Array.from(projectsById.values()).map((project) => ({
      value: project.id,
      label: project.name,
      searchText: [
        project.sNo,
        project.sNo ? `SN ${project.sNo}` : null,
        project.sNo ? `S.N ${project.sNo}` : null,
        project.sNo ? `S.No ${project.sNo}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      sublabel: [project.sNo ? `S.N ${project.sNo}` : null, project.fiscalYear]
        .filter(Boolean)
        .join(" / "),
    }));

    return addMissingOption(
      options,
      contract?.project
        ? {
            value: contract.project.id,
            label: contract.project.name,
            searchText: contract.project.sNo
              ? `${contract.project.sNo} SN ${contract.project.sNo} S.N ${contract.project.sNo} S.No ${contract.project.sNo}`
              : undefined,
            sublabel: contract.project.sNo ? `S.N ${contract.project.sNo}` : undefined,
          }
        : null
    );
  }, [baseProjectsRaw, contract, searchedProjectsRaw]);

  const companyOptions = useMemo(() => {
    const options = companies.map((company) => ({
      value: company.id,
      label: company.name,
      sublabel: company.panNumber ? `PAN ${company.panNumber}` : undefined,
    }));

    return addMissingOption(
      options,
      contract?.company
        ? {
            value: contract.company.id,
            label: contract.company.name,
            sublabel: contract.company.panNumber ? `PAN ${contract.company.panNumber}` : undefined,
          }
        : null
    );
  }, [companies, contract]);

  const committeeOptions = useMemo(() => {
    const options = extractList<{ id: string; name: string; fiscalYear?: string | null }>(
      committeesRaw
    ).map((committee) => ({
      value: committee.id,
      label: committee.name,
      sublabel: committee.fiscalYear ?? undefined,
    }));

    return addMissingOption(
      options,
      contract?.userCommittee
        ? { value: contract.userCommittee.id, label: contract.userCommittee.name }
        : null
    );
  }, [committeesRaw, contract]);

  const siteInchargeOptions = useMemo(() => {
    const users = extractList<{
      id: string;
      name: string | null;
      email?: string | null;
      designation?: string | null;
    }>(siteInchargesRaw);

    const options = users.map((user) => ({
      value: user.id,
      label: user.name || user.email || "Unnamed user",
      sublabel: user.designation ?? user.email ?? undefined,
    }));

    return addMissingOption(
      options,
      contract?.siteIncharge
        ? {
            value: contract.siteIncharge.id,
            label: contract.siteIncharge.name || contract.siteIncharge.email || "Current site incharge",
            sublabel: contract.siteIncharge.designation ?? undefined,
          }
        : null
    );
  }, [contract, siteInchargesRaw]);

  const representativeOptions = useMemo(() => {
    const users = extractList<{
      id: string;
      name: string | null;
      email?: string | null;
      designation?: string | null;
    }>(representativesRaw);

    const options = users.map((user) => ({
      value: user.id,
      label: user.name || user.email || "Unnamed user",
      sublabel: user.designation ?? user.email ?? undefined,
    }));

    return addMissingOption(
      options,
      contract?.user
        ? {
            value: contract.user.id,
            label: contract.user.name || contract.user.email || "Current representative",
            sublabel: contract.user.designation ?? undefined,
        }
        : null
    );
  }, [contract, representativesRaw]);

  const selectedProject = projectOptions.find((option) => option.value === formData.projectId);
  const selectedSiteIncharge = siteInchargeOptions.find(
    (option) => option.value === formData.siteInchargeId
  );
  const selectedImplementor =
    companyOptions.find((option) => option.value === formData.companyId) ??
    committeeOptions.find((option) => option.value === formData.userCommitteeId);

  const updateField = (name: keyof EditFormState, value: string) => {
    setFormData((current) => {
      if (name === "companyId") {
        return { ...current, companyId: value, userCommitteeId: value ? "" : current.userCommitteeId };
      }
      if (name === "userCommitteeId") {
        return { ...current, userCommitteeId: value, companyId: value ? "" : current.companyId };
      }
      return { ...current, [name]: value };
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!contract) {
      setSubmitError("Failed to load contract for editing.");
      return;
    }

    try {
      await updateContract({ id: contractId, data: buildPayload(formData) });
      router.push(`/dashboard/contracts/${contractId}`);
    } catch (error: unknown) {
      console.error("Failed to update contract:", error);
      setSubmitError(getErrorMessage(error, "Failed to update contract. Please try again."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="space-y-4 p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 rounded-md border bg-destructive/10 p-4 text-destructive">
          <AlertCircle size={18} /> Failed to load contract for editing.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-1">
        <button
          onClick={() => router.back()}
          className="mb-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Details
        </button>
        <h1 className="text-2xl font-bold">Edit Contract: {contract.contractNumber}</h1>
        <p className="text-sm text-muted-foreground">
          Dates are shown and edited in BS. Project, people, and implementor fields use names
          instead of long IDs.
        </p>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-md border bg-destructive/10 p-4 text-destructive">
          <AlertCircle size={18} /> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contract Details
          </legend>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Contract Number" required>
              <input
                type="text"
                name="contractNumber"
                required
                value={formData.contractNumber}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </Field>

            <Field label="Contract Amount (Rs.)" required>
              <input
                type="number"
                name="contractAmount"
                required
                min="1"
                step="0.01"
                value={formData.contractAmount}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 font-mono"
              />
            </Field>

            <Field label="Start Date (BS)" required hint="Use YYYY-MM-DD, for example 2082-01-15.">
              <BsDateInput
                name="startDate"
                required
                value={formData.startDate}
                onChange={updateField}
              />
            </Field>

            <Field
              label="Intended Completion Date (BS)"
              required
              hint="Use YYYY-MM-DD, for example 2082-03-30."
            >
              <BsDateInput
                name="intendedCompletionDate"
                required
                value={formData.intendedCompletionDate}
                onChange={updateField}
              />
            </Field>

            <Field label="Actual Completion Date (BS)" hint="Optional. Leave blank if work is not completed.">
              <BsDateInput
                name="actualCompletionDate"
                value={formData.actualCompletionDate}
                onChange={updateField}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Assignments
          </legend>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field
              label="Project"
              required
              hint={
                selectedProject
                  ? `Selected: ${selectedProject.label}`
                  : isLoadingProjects
                    ? "Loading projects..."
                    : undefined
              }
            >
              <FriendlySelect
                name="projectId"
                required
                value={formData.projectId}
                options={projectOptions}
                placeholder="Select project"
                searchPlaceholder="Search project by name, S.No, or fiscal year..."
                searchValue={projectSearch}
                onSearchChange={setProjectSearch}
                isLoading={isLoadingProjects}
                onChange={updateField}
              />
            </Field>

            <Field
              label="Site Incharge"
              hint={
                selectedSiteIncharge
                  ? `Selected: ${selectedSiteIncharge.label}`
                  : isLoadingSiteIncharges
                    ? "Loading users..."
                    : "Optional"
              }
            >
              <FriendlySelect
                name="siteInchargeId"
                value={formData.siteInchargeId}
                options={siteInchargeOptions}
                placeholder="Select site incharge"
                searchPlaceholder="Search site incharge by name, email, or designation..."
                searchValue={siteInchargeSearch}
                onSearchChange={setSiteInchargeSearch}
                isLoading={isLoadingSiteIncharges}
                onChange={updateField}
              />
            </Field>

            <Field
              label="Company / Contractor"
              hint="Select this when the contract is implemented through a company."
            >
              <FriendlySelect
                name="companyId"
                value={formData.companyId}
                options={companyOptions}
                placeholder="Select company"
                searchPlaceholder="Search company by name or PAN..."
                searchValue={companySearch}
                onSearchChange={setCompanySearch}
                isLoading={isLoadingCompanies}
                onChange={updateField}
              />
            </Field>

            <Field
              label="User Committee"
              hint="Select this when the contract is implemented through a user committee."
            >
              <FriendlySelect
                name="userCommitteeId"
                value={formData.userCommitteeId}
                options={committeeOptions}
                placeholder="Select user committee"
                searchPlaceholder="Search user committee by name or fiscal year..."
                searchValue={committeeSearch}
                onSearchChange={setCommitteeSearch}
                isLoading={isLoadingCommittees}
                onChange={updateField}
              />
            </Field>

            <Field label="Committee Representative" hint="Optional user linked to the committee side.">
              <FriendlySelect
                name="userID"
                value={formData.userID}
                options={representativeOptions}
                placeholder="Select representative"
                searchPlaceholder="Search representative by name, email, or designation..."
                searchValue={representativeSearch}
                onSearchChange={setRepresentativeSearch}
                isLoading={isLoadingRepresentatives}
                onChange={updateField}
              />
            </Field>

            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Current Selection</p>
              <p className="mt-2 text-muted-foreground">
                Project: <span className="text-foreground">{selectedProject?.label ?? "Not selected"}</span>
              </p>
              <p className="text-muted-foreground">
                Implementor:{" "}
                <span className="text-foreground">{selectedImplementor?.label ?? "Not selected"}</span>
              </p>
            </div>
          </div>
        </fieldset>

        <Field label="Remarks">
          <textarea
            name="remarks"
            rows={3}
            value={formData.remarks}
            onChange={handleChange}
            className="w-full resize-none rounded-md border bg-background px-3 py-2"
            placeholder="Add any additional notes here..."
          />
        </Field>

        <div className="flex justify-end gap-4 border-t pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

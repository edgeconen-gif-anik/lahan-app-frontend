"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  useContracts,
  useCreateContract,
  useNextContractNumber,
} from "@/hooks/contract/useContracts";
import { useCompanies } from "@/hooks/company/useCompany";
import { useProjects } from "@/hooks/project/useProjects";
import { useSystemSetup } from "@/hooks/setup/useSetup";
import { useAllUserCommittees } from "@/hooks/user-committee/useUserCommittees";
import { useUsers } from "@/hooks/user/useUsers";
import { useRole } from "@/lib/auth/use-role";
import {
  buildAgreementDraftText,
  buildWorkOrderDraftText,
} from "@/lib/contract-documents";
import { toAdDate } from "@/lib/date-utils";
import { isApprovedStatus } from "@/lib/schema/approval";
import type { CreateContractPayload } from "@/lib/schema/contract/contract";
import { contractService } from "@/services/contract/contractService";
import {
  INITIAL_FORM_DATA,
  INITIAL_SNAPSHOT,
  LAST_STEP,
  type CompanyRecord,
  type ComboboxOption,
  type ContractFormData,
  type ContractFormSnapshot,
  type ContractNoMode,
  type ContractProjectOption,
  type DocumentContentMode,
  type FieldErrors,
  type ImplementationBy,
  type UserCommitteeRecord,
  type UserRecord,
} from "./types";
import { useContractDraft } from "./use-contract-draft";
import {
  collectErrors,
  getAllFields,
  getStepFields,
  validateContractField,
  type ValidationContext,
} from "./validation";

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

function extractList<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "object" && raw !== null) {
    const withData = raw as { data?: T[]; results?: T[] };
    if (Array.isArray(withData.data)) return withData.data;
    if (Array.isArray(withData.results)) return withData.results;
  }
  return [];
}

function toIsoDate(bsDate: string): string | null {
  if (!bsDate) return null;
  const adDate = toAdDate(bsDate);
  return adDate ? adDate.toISOString() : null;
}

/** True once the user has entered something worth keeping as a draft. */
function hasMeaningfulContent(snapshot: ContractFormSnapshot) {
  const { formData: data } = snapshot;

  return Boolean(
    data.projectId ||
      data.contractAmount > 0 ||
      data.startDate ||
      data.intendedCompletionDate ||
      data.remarks.trim() ||
      data.companyId ||
      data.userCommitteeId ||
      data.siteInchargeId ||
      snapshot.includeAgreement ||
      snapshot.includeWorkOrder ||
      // A sequential number is filled in automatically, so it doesn't count.
      (snapshot.contractNumberMode === "manual" && data.contractNumber.trim()),
  );
}

function getSubmitErrorMessage(error: unknown) {
  const message =
    typeof error === "object" && error !== null
      ? ((
          error as {
            message?: string;
            response?: { data?: { message?: string | string[] } };
          }
        ).response?.data?.message ?? (error as { message?: string }).message)
      : undefined;

  return Array.isArray(message)
    ? message.join(" | ")
    : (message ?? "Failed to create contract. Please try again.");
}

export function useContractForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useRole();
  const { data: setup } = useSystemSetup();
  const { mutateAsync: createContract, isPending } = useCreateContract();

  const [formData, setFormData] = useState<ContractFormData>(INITIAL_FORM_DATA);
  const [contractNumberMode, setContractNumberMode] =
    useState<ContractNoMode>("sequential");
  const [includeAgreement, setIncludeAgreement] = useState(false);
  const [includeWorkOrder, setIncludeWorkOrder] = useState(false);
  const [implementationBy, setImplementationBy] =
    useState<ImplementationBy>("COMPANY");
  const [agreementContentMode, setAgreementContentMode] =
    useState<DocumentContentMode>("auto");
  const [workOrderContentMode, setWorkOrderContentMode] =
    useState<DocumentContentMode>("auto");

  const [step, setStep] = useState(0);
  const [attemptedSteps, setAttemptedSteps] = useState<number[]>([]);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [projectSearch, setProjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const debouncedProjectSearch = useDebounce(projectSearch, 350);
  const debouncedUserSearch = useDebounce(userSearch, 350);
  const currentFiscalYear = setup?.currentFiscalYear;

  const {
    contractNumber: serverContractNumber,
    source: contractNumberSource,
    isLoading: isLoadingContractNumber,
    refetch: refetchContractNumber,
  } = useNextContractNumber(formData.projectId || undefined);

  const { data: projects, isLoading: isLoadingProjects } = useProjects({
    search: debouncedProjectSearch,
    fiscalYear: currentFiscalYear,
  });
  const { data: existingContracts = [] } = useContracts({
    fiscalYear: currentFiscalYear,
  });
  const {
    data: users,
    isError: isUsersError,
    isLoading: isLoadingUsers,
  } = useUsers({ search: debouncedUserSearch }, { enabled: isAdmin });
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies({
    fiscalYear: currentFiscalYear,
  });
  const { data: userCommittees, isLoading: isLoadingUC } = useAllUserCommittees({
    fiscalYear: currentFiscalYear,
  });

  // ── Options ────────────────────────────────────────────────────────────────

  const existingContractByProjectId = useMemo(
    () =>
      new Map(
        existingContracts.map((contract) => [
          contract.projectId,
          { id: contract.id, contractNumber: contract.contractNumber },
        ]),
      ),
    [existingContracts],
  );

  const projectOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<ContractProjectOption>(projects).map((project) => {
        const existing = existingContractByProjectId.get(project.id);

        return {
          value: project.id,
          label: project.name,
          sublabel:
            [
              project.sNo ? `S.No: ${project.sNo}` : null,
              project.fiscalYear,
              existing ? `Already contracted: ${existing.contractNumber}` : null,
            ]
              .filter(Boolean)
              .join(" | ") || undefined,
        };
      }),
    [projects, existingContractByProjectId],
  );

  const companyOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<CompanyRecord>(companies)
        .filter((company) => isApprovedStatus(company.approvalStatus))
        .map((company) => ({
          value: company.id,
          label: company.name,
          sublabel: company.panNumber ? `PAN: ${company.panNumber}` : undefined,
        })),
    [companies],
  );

  const userCommitteeOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<UserCommitteeRecord>(userCommittees).map((committee) => ({
        value: committee.id,
        label: committee.name,
      })),
    [userCommittees],
  );

  const adminUserOptions = useMemo<ComboboxOption[]>(
    () =>
      extractList<UserRecord>(users).map((user) => ({
        value: user.id,
        label: user.name,
        sublabel: user.designation ?? user.email ?? undefined,
      })),
    [users],
  );

  const currentUserOption: ComboboxOption[] = session?.user?.id
    ? [
        {
          value: session.user.id,
          label: session.user.name ?? "Current user",
          sublabel: session.user.email ?? "Logged in user",
        },
      ]
    : [];

  const userOptions = isAdmin ? adminUserOptions : currentUserOption;
  const siteInchargeValue = isAdmin
    ? (formData.siteInchargeId ?? "")
    : (session?.user?.id ?? "");
  const siteInchargeHint = isAdmin
    ? isUsersError
      ? "Users could not be loaded. Check permissions or try again."
      : "Search and select the user responsible for site supervision."
    : "Your account is automatically assigned as site incharge.";

  const selectedProject = projectOptions.find(
    (option) => option.value === formData.projectId,
  );
  const selectedProjectExistingContract = formData.projectId
    ? existingContractByProjectId.get(formData.projectId)
    : undefined;
  const selectedImplementor =
    implementationBy === "COMPANY"
      ? companyOptions.find((option) => option.value === (formData.companyId ?? ""))
      : userCommitteeOptions.find(
          (option) => option.value === (formData.userCommitteeId ?? ""),
        );
  const selectedSiteIncharge = userOptions.find(
    (option) => option.value === siteInchargeValue,
  );

  // ── Generated document text ────────────────────────────────────────────────

  const implementorLabelFor = (state: ContractFormData, variant: ImplementationBy) =>
    variant === "COMPANY"
      ? companyOptions.find((option) => option.value === (state.companyId ?? ""))?.label
      : userCommitteeOptions.find(
          (option) => option.value === (state.userCommitteeId ?? ""),
        )?.label;

  const projectLabelFor = (state: ContractFormData) =>
    projectOptions.find((option) => option.value === state.projectId)?.label;

  const buildAgreementDraftFor = (state: ContractFormData, variant: ImplementationBy) =>
    buildAgreementDraftText({
      variant,
      contractNumber: state.contractNumber,
      projectName: projectLabelFor(state),
      implementorName: implementorLabelFor(state, variant),
      contractAmount: state.contractAmount,
      agreementAmount: state.agreement.amount || state.contractAmount,
      startDateBs: state.startDate,
      intendedCompletionDateBs: state.intendedCompletionDate,
      agreementDateBs: state.agreement.agreementDate,
    });

  const buildWorkOrderDraftFor = (state: ContractFormData, variant: ImplementationBy) =>
    buildWorkOrderDraftText({
      variant,
      contractNumber: state.contractNumber,
      projectName: projectLabelFor(state),
      implementorName: implementorLabelFor(state, variant),
      contractAmount: state.contractAmount,
      startDateBs: state.startDate,
      intendedCompletionDateBs: state.intendedCompletionDate,
      workCompletionDateBs: state.workOrder.workCompletionDate,
    });

  const agreementDraftText = buildAgreementDraftFor(formData, implementationBy);
  const workOrderDraftText = buildWorkOrderDraftFor(formData, implementationBy);
  const agreementContentValue =
    agreementContentMode === "auto" ? agreementDraftText : formData.agreement.content;
  const workOrderContentValue =
    workOrderContentMode === "auto" ? workOrderDraftText : formData.workOrder.content;

  // ── Live "is this contract number taken?" check ───────────────────────────
  // Server-suggested numbers are unique by construction; typed or random ones
  // are checked against existing contracts while the user is still on the form.

  const trimmedNumber = formData.contractNumber.trim();
  const debouncedNumber = useDebounce(trimmedNumber, 500);
  const shouldCheckNumber =
    contractNumberMode !== "sequential" && debouncedNumber.length >= 3;
  const { data: numberMatches, isFetching: isCheckingNumber } = useQuery({
    queryKey: ["contract-number-check", debouncedNumber],
    queryFn: () =>
      contractService.getAll({ search: debouncedNumber, fiscalYear: "all" }),
    enabled: shouldCheckNumber,
    staleTime: 15_000,
  });
  const takenMatch = shouldCheckNumber
    ? numberMatches?.find(
        (contract) =>
          contract.contractNumber.toLowerCase() === debouncedNumber.toLowerCase(),
      )
    : undefined;
  const takenContractNumber =
    takenMatch && debouncedNumber.toLowerCase() === trimmedNumber.toLowerCase()
      ? { value: takenMatch.contractNumber, owner: takenMatch.project?.name }
      : null;

  // ── Validation ─────────────────────────────────────────────────────────────

  const validationContext: ValidationContext = {
    implementationBy,
    includeAgreement,
    includeWorkOrder,
    agreementContentMode,
    workOrderContentMode,
    isAdmin,
    sessionUserId: session?.user?.id,
    existingContractByProjectId,
    takenContractNumber,
    buildAgreementDraft: (state) => buildAgreementDraftFor(state, implementationBy),
    buildWorkOrderDraft: (state) => buildWorkOrderDraftFor(state, implementationBy),
  };

  const stepFields = (stepIndex: number) => getStepFields(stepIndex, validationContext);

  // Errors appear for fields the user has touched, and for every field of any
  // step they have already tried to move past.
  const visibleFieldPaths = new Set([
    ...Object.keys(touchedFields).filter((fieldPath) => touchedFields[fieldPath]),
    ...attemptedSteps.flatMap(stepFields),
  ]);
  const fieldErrors: FieldErrors = collectErrors(
    [...visibleFieldPaths],
    formData,
    validationContext,
  );
  const errorCountForStep = (stepIndex: number) =>
    stepFields(stepIndex).filter((fieldPath) => fieldErrors[fieldPath]).length;
  const allErrors = collectErrors(getAllFields(validationContext), formData, validationContext);

  const markTouched = (...fieldPaths: string[]) =>
    setTouchedFields((previous) => {
      const next = { ...previous };
      fieldPaths.forEach((fieldPath) => {
        next[fieldPath] = true;
      });
      return next;
    });

  const scrollToField = (fieldPath: string | undefined) => {
    if (!fieldPath) return;
    window.setTimeout(() => {
      const element = document.querySelector(`[data-field-path="${fieldPath}"]`);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  };

  // ── Field setters ──────────────────────────────────────────────────────────

  const update = (updater: (current: ContractFormData) => ContractFormData) => {
    setSubmitError(null);
    setFormData(updater);
  };

  const setField = <K extends "contractNumber" | "contractAmount" | "startDate" | "intendedCompletionDate" | "remarks">(
    name: K,
    value: ContractFormData[K],
  ) => update((current) => ({ ...current, [name]: value }));

  const setAgreementField = <K extends keyof ContractFormData["agreement"]>(
    name: K,
    value: ContractFormData["agreement"][K],
  ) =>
    update((current) => ({
      ...current,
      agreement: { ...current.agreement, [name]: value },
    }));

  const setWorkOrderField = <K extends keyof ContractFormData["workOrder"]>(
    name: K,
    value: ContractFormData["workOrder"][K],
  ) =>
    update((current) => ({
      ...current,
      workOrder: { ...current.workOrder, [name]: value },
    }));

  const setProject = (projectId: string) => {
    markTouched("projectId");
    update((current) => ({
      ...current,
      projectId,
      siteInchargeId: isAdmin ? current.siteInchargeId : (session?.user?.id ?? ""),
    }));
  };

  const setSiteIncharge = (siteInchargeId: string) => {
    markTouched("siteInchargeId");
    update((current) => ({ ...current, siteInchargeId }));
  };

  const setCompany = (companyId: string) => {
    markTouched("companyId");
    update((current) => ({ ...current, companyId }));
  };

  const setUserCommittee = (userCommitteeId: string) => {
    markTouched("userCommitteeId");
    update((current) => ({ ...current, userCommitteeId }));
  };

  const changeImplementation = (next: ImplementationBy) => {
    setSubmitError(null);
    markTouched(next === "COMPANY" ? "companyId" : "userCommitteeId");
    setImplementationBy(next);
    setFormData((current) => ({
      ...current,
      companyId: next === "USER_COMMITTEE" ? "" : current.companyId,
      userCommitteeId: next === "COMPANY" ? "" : current.userCommitteeId,
    }));
  };

  const toggleAgreementContentMode = () => {
    setSubmitError(null);

    if (agreementContentMode === "auto") {
      setAgreementContentMode("manual");
      setFormData((current) => ({
        ...current,
        agreement: {
          ...current.agreement,
          content:
            current.agreement.content.trim() ||
            buildAgreementDraftFor(current, implementationBy),
        },
      }));
      markTouched("agreement.content");
      return;
    }

    setAgreementContentMode("auto");
  };

  const toggleWorkOrderContentMode = () => {
    setSubmitError(null);

    if (workOrderContentMode === "auto") {
      setWorkOrderContentMode("manual");
      setFormData((current) => ({
        ...current,
        workOrder: {
          ...current.workOrder,
          content:
            current.workOrder.content.trim() ||
            buildWorkOrderDraftFor(current, implementationBy),
        },
      }));
      markTouched("workOrder.content");
      return;
    }

    setWorkOrderContentMode("auto");
  };

  const toggleAgreement = (checked: boolean) => {
    setSubmitError(null);
    setIncludeAgreement(checked);
    if (!checked) return;

    setAgreementContentMode("auto");
    setFormData((current) => ({
      ...current,
      agreement: {
        ...current.agreement,
        agreementDate: current.agreement.agreementDate || current.startDate,
        amount: Number(current.agreement.amount || current.contractAmount),
      },
    }));
  };

  const toggleWorkOrder = (checked: boolean) => {
    setSubmitError(null);
    setIncludeWorkOrder(checked);
    if (!checked) return;

    setWorkOrderContentMode("auto");
    setFormData((current) => ({
      ...current,
      workOrder: {
        ...current.workOrder,
        workCompletionDate:
          current.workOrder.workCompletionDate || current.intendedCompletionDate,
      },
    }));
  };

  // ── Step navigation ────────────────────────────────────────────────────────

  const attemptStep = (stepIndex: number) => {
    setAttemptedSteps((current) =>
      current.includes(stepIndex) ? current : [...current, stepIndex],
    );
    markTouched(...stepFields(stepIndex));
  };

  /** Moves to `target`, stopping at the first earlier step that has problems. */
  const goToStep = (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }

    for (let index = step; index < target; index += 1) {
      const errors = collectErrors(stepFields(index), formData, validationContext);
      const firstError = stepFields(index).find((fieldPath) => errors[fieldPath]);

      if (firstError) {
        attemptStep(index);
        setStep(index);
        scrollToField(firstError);
        return;
      }
    }

    setStep(target);
  };

  const nextStep = () => goToStep(Math.min(step + 1, LAST_STEP));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  // ── Draft autosave ─────────────────────────────────────────────────────────

  const draft = useContractDraft(session?.user?.id);
  const snapshot: ContractFormSnapshot = {
    formData,
    includeAgreement,
    includeWorkOrder,
    implementationBy,
    agreementContentMode,
    workOrderContentMode,
    contractNumberMode,
    step,
  };
  const snapshotJson = JSON.stringify(snapshot);
  const isWorthSaving = hasMeaningfulContent(snapshot);
  const { autosaveEnabled, save: saveDraft } = draft;

  useEffect(() => {
    if (!autosaveEnabled || !isWorthSaving || submitted) return;

    const timer = window.setTimeout(
      () => saveDraft(JSON.parse(snapshotJson) as ContractFormSnapshot),
      800,
    );
    return () => window.clearTimeout(timer);
  }, [autosaveEnabled, isWorthSaving, saveDraft, snapshotJson, submitted]);

  const restore = (saved: ContractFormSnapshot) => {
    setFormData({ ...INITIAL_FORM_DATA, ...saved.formData });
    setIncludeAgreement(saved.includeAgreement);
    setIncludeWorkOrder(saved.includeWorkOrder);
    setImplementationBy(saved.implementationBy);
    setAgreementContentMode(saved.agreementContentMode);
    setWorkOrderContentMode(saved.workOrderContentMode);
    setContractNumberMode(saved.contractNumberMode);
    setStep(Math.min(Math.max(saved.step ?? 0, 0), LAST_STEP));
  };

  const resumeDraft = () => {
    if (!draft.pendingDraft) return;
    restore(draft.pendingDraft.snapshot);
    draft.markResumed();
  };

  const startOver = () => {
    draft.discard();
    restore(INITIAL_SNAPSHOT);
    setAttemptedSteps([]);
    setTouchedFields({});
    setSubmitError(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    setSubmitError(null);

    if (Object.keys(allErrors).length > 0) {
      const firstStepWithError = [0, 1, 2].find((index) =>
        stepFields(index).some((fieldPath) => allErrors[fieldPath]),
      );
      [0, 1, 2].forEach(attemptStep);
      setSubmitError("Please review the highlighted fields and try again.");

      if (firstStepWithError !== undefined) {
        setStep(firstStepWithError);
        scrollToField(stepFields(firstStepWithError).find((path) => allErrors[path]));
      }
      return;
    }

    const startDate = toIsoDate(formData.startDate);
    const intendedCompletionDate = toIsoDate(formData.intendedCompletionDate);

    if (!startDate || !intendedCompletionDate) {
      setSubmitError("Some dates could not be converted. Please review the BS dates.");
      return;
    }

    const agreement = includeAgreement
      ? {
          ...formData.agreement,
          agreementDate: toIsoDate(formData.agreement.agreementDate)!,
          amount: Number(formData.agreement.amount || formData.contractAmount),
          content: agreementContentValue.trim(),
        }
      : undefined;

    const workOrder = includeWorkOrder
      ? {
          ...formData.workOrder,
          workCompletionDate: toIsoDate(formData.workOrder.workCompletionDate)!,
          content: workOrderContentValue.trim(),
        }
      : undefined;

    try {
      await createContract({
        contractNumber: formData.contractNumber.trim(),
        contractAmount: Number(formData.contractAmount),
        startDate,
        intendedCompletionDate,
        remarks: formData.remarks.trim() || undefined,
        projectId: formData.projectId,
        companyId:
          implementationBy === "COMPANY" ? formData.companyId || undefined : undefined,
        userCommitteeId:
          implementationBy === "USER_COMMITTEE"
            ? formData.userCommitteeId || undefined
            : undefined,
        siteInchargeId: isAdmin
          ? formData.siteInchargeId || undefined
          : session?.user?.id || undefined,
        agreement,
        workOrder,
      } as CreateContractPayload);

      setSubmitted(true);
      draft.clear();
    } catch (error: unknown) {
      setSubmitError(getSubmitErrorMessage(error));
    }
  };

  return {
    router,
    isAdmin,
    isSaving: isPending,

    formData,
    step,
    attemptedSteps,
    submitError,
    fieldErrors,
    allErrors,
    errorCountForStep,
    stepFields,

    // general step
    contractNumberMode,
    setContractNumberMode,
    serverContractNumber,
    contractNumberSource,
    isLoadingContractNumber,
    refetchContractNumber,
    isCheckingNumber: shouldCheckNumber && isCheckingNumber,
    projectOptions,
    isLoadingProjects,
    projectSearch,
    setProjectSearch,
    userOptions,
    isLoadingUsers,
    userSearch,
    setUserSearch,
    siteInchargeValue,
    siteInchargeHint,
    companyOptions,
    isLoadingCompanies,
    userCommitteeOptions,
    isLoadingUC,
    implementationBy,
    selectedProject,
    selectedProjectExistingContract,
    selectedImplementor,
    selectedSiteIncharge,

    // documents
    includeAgreement,
    includeWorkOrder,
    agreementContentMode,
    workOrderContentMode,
    agreementDraftText,
    workOrderDraftText,

    // actions
    markTouched,
    setField,
    setAgreementField,
    setWorkOrderField,
    setProject,
    setSiteIncharge,
    setCompany,
    setUserCommittee,
    changeImplementation,
    toggleAgreement,
    toggleWorkOrder,
    toggleAgreementContentMode,
    toggleWorkOrderContentMode,
    goToStep,
    nextStep,
    previousStep,
    submit,

    // drafts
    pendingDraft: draft.pendingDraft,
    lastSavedAt: draft.lastSavedAt,
    resumeDraft,
    discardPendingDraft: draft.discard,
    startOver,
    hasDraftContent: isWorthSaving,

    validateField: (fieldPath: string) =>
      validateContractField(fieldPath, formData, validationContext),
  };
}

export type ContractFormApi = ReturnType<typeof useContractForm>;

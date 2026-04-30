import type {
  FormApprovalNode,
  FormApprovalTemplate,
  FormAsyncValidationSummary,
  FormDraftPolicy,
  FormDraftState,
  FormFieldCondition,
  FormFieldDefinition,
  FormSchema,
  FormSubmissionResult,
  FormSubmitMode,
  FormSubmitState,
  FormValidationError,
  FormWorkflowState,
} from "@minix/contracts";

import { ok, type Result } from "../error/index";
import { cloneStateSnapshot, cloneStateSnapshotArray } from "../store/snapshot";

export interface FormPageState<TValues extends Record<string, unknown>, TResult = unknown> {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  loading: boolean;
  submitting: boolean;
  dirty: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  formValues: TValues;
  initialFormValues: TValues;
  validationErrors: FormValidationError[];
  submitState: FormSubmitState<TResult>;
  schema: FormSchema;
  workflow: FormWorkflowState;
  values: TValues;
  initialValues: TValues;
  fieldErrors: FormValidationError[];
  lastSubmission: FormSubmissionResult<TResult> | undefined;
}

export interface CreateFormPageStateOptions<TValues extends Record<string, unknown>, TResult = unknown> {
  title: string;
  subtitle?: string;
  values: TValues;
  schema?: Partial<FormSchema>;
  workflow?: Partial<FormWorkflowState>;
  submitState?: Partial<FormSubmitState<TResult>>;
}

export interface CreateDefaultFormPageStateOptions<TValues extends Record<string, unknown>, TResult = unknown> {
  title?: string;
  subtitle?: string;
  values: TValues;
  schema?: Partial<FormSchema>;
  workflow?: Partial<FormWorkflowState>;
  submitState?: Partial<FormSubmitState<TResult>>;
}

function cloneValues<TValues extends Record<string, unknown>>(values: TValues): TValues {
  return cloneStateSnapshot(values);
}

function normalizeComparableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeComparableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalizeComparableValue((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

function matchesCondition<TValues extends Record<string, unknown>>(values: TValues, condition: FormFieldCondition): boolean {
  const currentValue = values[condition.field];

  if (condition.operator === "truthy") {
    return Boolean(currentValue);
  }

  if (condition.operator === "falsy") {
    return !currentValue;
  }

  if (condition.operator === "in") {
    return Array.isArray(condition.value) ? condition.value.includes(currentValue as never) : false;
  }

  if (condition.operator === "neq") {
    return currentValue !== condition.value;
  }

  return currentValue === condition.value;
}

export function resolveVisibleFormFieldKeys<TValues extends Record<string, unknown>>(
  values: TValues,
  fields: FormFieldDefinition[],
): string[] {
  if (fields.length === 0) {
    return Object.keys(values);
  }

  return fields
    .filter((field) =>
      field.conditions && field.conditions.length > 0 ? field.conditions.every((condition) => matchesCondition(values, condition)) : true,
    )
    .map((field) => field.key);
}

export function createFormWorkflowState<TValues extends Record<string, unknown>>(input: {
  values: TValues;
  schema?: Partial<FormSchema>;
  currentStepKey?: string;
  approvalState?: FormWorkflowState["approvalState"];
  approvalNodes?: FormApprovalNode[];
  approvalTemplates?: FormApprovalTemplate[];
  draft?: FormDraftState;
  draftPolicy?: FormDraftPolicy;
  asyncValidation?: FormAsyncValidationSummary;
}): FormWorkflowState {
  const fields = input.schema?.fields ?? [];
  const steps = input.schema?.steps ?? [];
  const stepKeys = steps.map((step) => step.key);
  const visibleFieldKeys = resolveVisibleFormFieldKeys(input.values, fields);
  const dynamicFieldKeys = fields.filter((field) => field.dynamic).map((field) => field.key);
  const conditionalFieldKeys = fields.filter((field) => (field.conditions?.length ?? 0) > 0).map((field) => field.key);
  const uploadFieldKeys = fields
    .filter((field) => field.type === "upload_reference" || Boolean(field.uploadRole) || Boolean(field.uploadWorkflow))
    .map((field) => field.key);
  const currentStepKey =
    input.currentStepKey && stepKeys.includes(input.currentStepKey)
      ? input.currentStepKey
      : stepKeys[0];

  return {
    stepKeys,
    ...(currentStepKey ? { currentStepKey } : {}),
    approvalState: input.approvalState ?? "none",
    visibleFieldKeys,
    dynamicFieldKeys,
    conditionalFieldKeys,
    uploadFieldKeys,
    ...(input.asyncValidation ? { asyncValidation: cloneStateSnapshot(input.asyncValidation) } : {}),
    ...(input.approvalNodes && input.approvalNodes.length > 0 ? { approvalNodes: cloneStateSnapshotArray(input.approvalNodes) } : {}),
    ...(input.approvalTemplates && input.approvalTemplates.length > 0
      ? { approvalTemplates: cloneStateSnapshotArray(input.approvalTemplates) }
      : {}),
    ...(input.draft ? { draft: cloneStateSnapshot(input.draft) } : {}),
    ...(input.draftPolicy ? { draftPolicy: cloneStateSnapshot(input.draftPolicy) } : {}),
  };
}

export function createFormField(definition: FormFieldDefinition): FormFieldDefinition {
  return {
    ...definition,
    ...(definition.options ? { options: cloneStateSnapshotArray(definition.options) } : {}),
    ...(definition.conditions ? { conditions: cloneStateSnapshotArray(definition.conditions) } : {}),
  };
}

export function createFormSchema(input: {
  fields: FormFieldDefinition[];
  steps: FormSchema["steps"];
}): FormSchema {
  return {
    fields: cloneStateSnapshotArray(input.fields.map((field) => createFormField(field))),
    steps: cloneStateSnapshotArray(input.steps),
  };
}

export function createFormDraftState(input: {
  draftId: string;
  recoveryKey: string;
  savedAt: number;
  restored?: boolean;
}): FormDraftState {
  return {
    draftId: input.draftId,
    recoveryKey: input.recoveryKey,
    lastSavedAt: input.savedAt,
    ...(input.restored ? { restoredAt: Date.now() } : {}),
  };
}

export function createFormSubmissionKey<TValues extends Record<string, unknown>>(
  scope: string,
  mode: FormSubmitMode,
  values: TValues,
): string {
  return `${scope}:${mode}:${JSON.stringify(normalizeComparableValue(values))}`;
}

export function beginFormSubmit<TResult = unknown>(
  submitState: FormSubmitState<TResult>,
  input: {
    mode: FormSubmitMode;
    submissionKey: string;
  },
): { blocked: boolean; submitState: FormSubmitState<TResult> } {
  const now = Date.now();
  if (
    submitState.duplicateProtected &&
    (submitState.submissionKey === input.submissionKey || submitState.lastCompletedKey === input.submissionKey)
  ) {
    return {
      blocked: true,
      submitState: {
        ...submitState,
        mode: input.mode,
        duplicateBlocked: true,
        duplicateEvidence: {
          mode: input.mode,
          submissionKey: input.submissionKey,
          blockedAt: now,
        },
        submissionKey: input.submissionKey,
      },
    };
  }

  const { duplicateEvidence: _duplicateEvidence, ...submitStateWithoutEvidence } = submitState;
  return {
    blocked: false,
    submitState: {
      ...submitStateWithoutEvidence,
      phase: input.mode === "draft" ? "draft_saving" : "submitting",
      mode: input.mode,
      duplicateBlocked: false,
      submissionKey: input.submissionKey,
    },
  };
}

export function finalizeFormSubmit<TResult = unknown>(
  submitState: FormSubmitState<TResult>,
  input: {
    mode: FormSubmitMode;
    submissionKey: string;
    submittedAt: number;
    result?: TResult;
    draftSavedAt?: number;
    phase?: FormSubmitState<TResult>["phase"];
  },
): FormSubmitState<TResult> {
  const { duplicateEvidence: _duplicateEvidence, ...submitStateWithoutEvidence } = submitState;
  return {
    ...submitStateWithoutEvidence,
    phase: input.phase ?? (input.mode === "draft" ? "idle" : "submitted"),
    mode: input.mode,
    duplicateBlocked: false,
    ...(input.mode === "draft" ? { draftSavedAt: input.draftSavedAt ?? input.submittedAt } : { submittedAt: input.submittedAt }),
    lastCompletedKey: input.submissionKey,
    ...(input.result !== undefined ? { result: input.result } : {}),
  };
}

export interface RunFormDraftFlowOptions<
  TValues extends Record<string, unknown>,
  TSnapshot extends { savedAt: number; values: TValues },
  TResult = unknown,
> {
  scope: string;
  submitState: FormSubmitState<TResult>;
  snapshot: TSnapshot;
  persist: (snapshot: TSnapshot) => Promise<Result<unknown>>;
  onStarted: (submitState: FormSubmitState<TResult>) => void;
  onDuplicate: (submitState: FormSubmitState<TResult>) => void;
  onFailure: (result: Extract<Result<unknown>, { ok: false }>) => void;
  onSuccess: (input: {
    snapshot: TSnapshot;
    submitState: FormSubmitState<TResult>;
    submissionKey: string;
  }) => void;
}

export async function runFormDraftFlow<
  TValues extends Record<string, unknown>,
  TSnapshot extends { savedAt: number; values: TValues },
  TResult = unknown,
>(options: RunFormDraftFlowOptions<TValues, TSnapshot, TResult>): Promise<Result<void>> {
  const submissionKey = createFormSubmissionKey(options.scope, "draft", options.snapshot.values);
  const nextSubmit = beginFormSubmit(options.submitState, {
    mode: "draft",
    submissionKey,
  });

  if (nextSubmit.blocked) {
    options.onDuplicate(nextSubmit.submitState);
    return ok(undefined);
  }

  options.onStarted(nextSubmit.submitState);
  const result = await options.persist(options.snapshot);
  if (!result.ok) {
    options.onFailure(result);
    return result;
  }

  options.onSuccess({
    snapshot: options.snapshot,
    submissionKey,
    submitState: finalizeFormSubmit(nextSubmit.submitState, {
      mode: "draft",
      submissionKey,
      submittedAt: options.snapshot.savedAt,
      draftSavedAt: options.snapshot.savedAt,
    }),
  });
  return ok(undefined);
}

export interface RunFormSubmitFlowOptions<
  TValues extends Record<string, unknown>,
  TResult = unknown,
> {
  scope: string;
  submitState: FormSubmitState<TResult>;
  values: TValues;
  submit: (values: TValues) => Promise<Result<TResult>>;
  onStarted: (submitState: FormSubmitState<TResult>) => void;
  onDuplicate: (submitState: FormSubmitState<TResult>) => void;
  onFailure: (input: {
    result: Extract<Result<TResult>, { ok: false }>;
    submitState: FormSubmitState<TResult>;
    submissionKey: string;
  }) => void | Promise<void>;
  onSuccess: (input: {
    values: TValues;
    result: TResult;
    submittedAt: number;
    submitState: FormSubmitState<TResult>;
    submissionKey: string;
  }) => void | Promise<void>;
}

export async function runFormSubmitFlow<
  TValues extends Record<string, unknown>,
  TResult = unknown,
>(options: RunFormSubmitFlowOptions<TValues, TResult>): Promise<Result<TResult | undefined>> {
  const submissionKey = createFormSubmissionKey(options.scope, "submit", options.values);
  const nextSubmit = beginFormSubmit(options.submitState, {
    mode: "submit",
    submissionKey,
  });

  if (nextSubmit.blocked) {
    options.onDuplicate(nextSubmit.submitState);
    return ok(undefined);
  }

  options.onStarted(nextSubmit.submitState);
  const result = await options.submit(options.values);
  if (!result.ok) {
    await options.onFailure({
      result,
      submissionKey,
      submitState: {
        ...nextSubmit.submitState,
        phase: "failed",
      },
    });
    return result;
  }

  const submittedAt = Date.now();
  await options.onSuccess({
    values: options.values,
    result: result.value,
    submittedAt,
    submissionKey,
    submitState: finalizeFormSubmit(nextSubmit.submitState, {
      mode: "submit",
      submissionKey,
      submittedAt,
      result: result.value,
    }),
  });
  return result;
}

export function createFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  options: CreateFormPageStateOptions<TValues, TResult>,
): FormPageState<TValues, TResult> {
  const values = cloneValues(options.values);
  const initialValues = cloneValues(options.values);
  const schema: FormSchema = {
    fields: cloneStateSnapshotArray(options.schema?.fields ?? []),
    steps: cloneStateSnapshotArray(options.schema?.steps ?? []),
  };
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    submitting: false,
    dirty: false,
    errorCode: undefined,
    errorText: undefined,
    formValues: values,
    initialFormValues: initialValues,
    validationErrors: [],
    submitState: {
      phase: "idle",
      duplicateProtected: true,
      draftCapable: true,
      ...options.submitState,
    },
    schema,
    workflow: {
      ...createFormWorkflowState({
        values,
        schema,
      }),
      ...options.workflow,
    },
    values,
    initialValues,
    fieldErrors: [],
    lastSubmission: undefined,
  };
}

export function createDefaultFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  options: CreateDefaultFormPageStateOptions<TValues, TResult>,
): FormPageState<TValues, TResult> {
  return createFormPageState({
    title: options.title ?? "Form",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    values: options.values,
    ...(options.schema ? { schema: options.schema } : {}),
    ...(options.workflow ? { workflow: options.workflow } : {}),
    ...(options.submitState ? { submitState: options.submitState } : {}),
  });
}

export function cloneFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  state: FormPageState<TValues, TResult>,
): FormPageState<TValues, TResult> {
  return cloneStateSnapshot(state);
}

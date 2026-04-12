import type {
  FormApprovalNode,
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
  return structuredClone(values);
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
  draft?: FormDraftState;
}): FormWorkflowState {
  const fields = input.schema?.fields ?? [];
  const steps = input.schema?.steps ?? [];
  const stepKeys = steps.map((step) => step.key);
  const visibleFieldKeys = resolveVisibleFormFieldKeys(input.values, fields);
  const dynamicFieldKeys = fields.filter((field) => field.dynamic).map((field) => field.key);
  const conditionalFieldKeys = fields.filter((field) => (field.conditions?.length ?? 0) > 0).map((field) => field.key);
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
    ...(input.approvalNodes && input.approvalNodes.length > 0 ? { approvalNodes: structuredClone(input.approvalNodes) } : {}),
    ...(input.draft ? { draft: structuredClone(input.draft) } : {}),
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
        submissionKey: input.submissionKey,
      },
    };
  }

  return {
    blocked: false,
    submitState: {
      ...submitState,
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
  return {
    ...submitState,
    phase: input.phase ?? (input.mode === "draft" ? "idle" : "submitted"),
    mode: input.mode,
    duplicateBlocked: false,
    ...(input.mode === "draft" ? { draftSavedAt: input.draftSavedAt ?? input.submittedAt } : { submittedAt: input.submittedAt }),
    lastCompletedKey: input.submissionKey,
    ...(input.result !== undefined ? { result: input.result } : {}),
  };
}

export function createFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  options: CreateFormPageStateOptions<TValues, TResult>,
): FormPageState<TValues, TResult> {
  const values = cloneValues(options.values);
  const initialValues = cloneValues(options.values);
  const schema: FormSchema = {
    fields: options.schema?.fields ? structuredClone(options.schema.fields) : [],
    steps: options.schema?.steps ? structuredClone(options.schema.steps) : [],
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

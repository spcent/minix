import type {
  FormSubmissionResult,
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
  workflow?: Partial<FormWorkflowState>;
  submitState?: Partial<FormSubmitState<TResult>>;
}

export interface CreateDefaultFormPageStateOptions<TValues extends Record<string, unknown>, TResult = unknown> {
  title?: string;
  subtitle?: string;
  values: TValues;
  workflow?: Partial<FormWorkflowState>;
  submitState?: Partial<FormSubmitState<TResult>>;
}

function cloneValues<TValues extends Record<string, unknown>>(values: TValues): TValues {
  return structuredClone(values);
}

export function createFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  options: CreateFormPageStateOptions<TValues, TResult>,
): FormPageState<TValues, TResult> {
  const values = cloneValues(options.values);
  const initialValues = cloneValues(options.values);
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
    workflow: {
      stepKeys: [],
      approvalState: "none",
      visibleFieldKeys: Object.keys(values),
      dynamicFieldKeys: [],
      conditionalFieldKeys: [],
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
    ...(options.workflow ? { workflow: options.workflow } : {}),
    ...(options.submitState ? { submitState: options.submitState } : {}),
  });
}

import type { FormFieldError, FormSubmissionResult } from "@minix/contracts";

export interface FormPageState<TValues extends Record<string, unknown>, TResult = unknown> {
  title: string;
  subtitle: string | undefined;
  ready: boolean;
  loading: boolean;
  submitting: boolean;
  dirty: boolean;
  errorCode: string | undefined;
  errorText: string | undefined;
  values: TValues;
  initialValues: TValues;
  fieldErrors: FormFieldError[];
  lastSubmission: FormSubmissionResult<TResult> | undefined;
}

export interface CreateFormPageStateOptions<TValues extends Record<string, unknown>, TResult = unknown> {
  title: string;
  subtitle?: string;
  values: TValues;
}

export interface CreateDefaultFormPageStateOptions<TValues extends Record<string, unknown>, TResult = unknown> {
  title?: string;
  subtitle?: string;
  values: TValues;
}

function cloneValues<TValues extends Record<string, unknown>>(values: TValues): TValues {
  return { ...values };
}

export function createFormPageState<TValues extends Record<string, unknown>, TResult = unknown>(
  options: CreateFormPageStateOptions<TValues, TResult>,
): FormPageState<TValues, TResult> {
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
    loading: false,
    submitting: false,
    dirty: false,
    errorCode: undefined,
    errorText: undefined,
    values: cloneValues(options.values),
    initialValues: cloneValues(options.values),
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
  });
}

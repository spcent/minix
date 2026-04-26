import {
  AUTH_REDIRECT_REASONS,
  type ActorContextSnapshot,
  type AuthRedirectTarget,
  type SourceContextSnapshot,
} from "@minix/contracts";
import { z } from "zod";

export const apiPaginationQueryShape = {
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
} as const;

export function createApiPageSizeQuerySchema(max: number) {
  return z.coerce.number().int().positive().max(max).optional();
}

export const apiPageSizeMax50QuerySchema = createApiPageSizeQuerySchema(50);
export const apiPageSizeMax100QuerySchema = createApiPageSizeQuerySchema(100);

export const apiQueryBooleanSchema = z.enum(["true", "false"]).transform((value) => value === "true");

export const apiRouteParamsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const apiSourceContextSchema = z.object({
  pagePath: z.string().min(1).optional(),
  routeId: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  params: apiRouteParamsSchema.optional(),
});

export const apiActorContextSchema = z.object({
  userId: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  appVersion: z.string().min(1).optional(),
  deviceSummary: z.string().min(1).optional(),
});

export const apiAuthRedirectTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  params: apiRouteParamsSchema.optional(),
  source: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  reason: z.enum(AUTH_REDIRECT_REASONS).optional(),
  forceReauth: z.boolean().optional(),
});

type ApiSourceContext = z.infer<typeof apiSourceContextSchema>;
type ApiActorContext = z.infer<typeof apiActorContextSchema>;
type ApiAuthRedirectTarget = z.infer<typeof apiAuthRedirectTargetSchema>;
type ApiContextSnapshotInput = {
  sourceContext?: ApiSourceContext;
  actorContext?: ApiActorContext;
};
type ApiContextSnapshots = {
  sourceContext?: SourceContextSnapshot;
  actorContext?: ActorContextSnapshot;
};

function omitUndefinedProperties<TValue extends Record<string, unknown>>(value: TValue): Partial<TValue> {
  const result: Partial<TValue> = {};

  for (const [key, fieldValue] of Object.entries(value) as [keyof TValue, TValue[keyof TValue]][]) {
    if (fieldValue !== undefined) {
      result[key] = fieldValue;
    }
  }

  return result;
}

export function normalizeApiSourceContext(value: ApiSourceContext | undefined): SourceContextSnapshot | undefined {
  return value
    ? (omitUndefinedProperties({
        pagePath: value.pagePath,
        routeId: value.routeId,
        label: value.label,
        params: value.params,
      }) as SourceContextSnapshot)
    : undefined;
}

export function normalizeApiActorContext(value: ApiActorContext | undefined): ActorContextSnapshot | undefined {
  return value
    ? (omitUndefinedProperties({
        userId: value.userId,
        platform: value.platform,
        appVersion: value.appVersion,
        deviceSummary: value.deviceSummary,
      }) as ActorContextSnapshot)
    : undefined;
}

export function normalizeApiContextSnapshots(value: ApiContextSnapshotInput | undefined): ApiContextSnapshots {
  const sourceContext = normalizeApiSourceContext(value?.sourceContext);
  const actorContext = normalizeApiActorContext(value?.actorContext);

  return {
    ...(sourceContext !== undefined ? { sourceContext } : {}),
    ...(actorContext !== undefined ? { actorContext } : {}),
  };
}

export function normalizeApiAuthRedirectTarget(
  value: ApiAuthRedirectTarget | undefined,
): AuthRedirectTarget | undefined {
  return value
    ? (omitUndefinedProperties({
        routeId: value.routeId,
        path: value.path,
        params: value.params,
        source: value.source,
        label: value.label,
        reason: value.reason,
        forceReauth: value.forceReauth,
      }) as AuthRedirectTarget)
    : undefined;
}

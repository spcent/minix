import { AUTH_REDIRECT_REASONS } from "@minix/contracts";
import { z } from "zod";

export const apiPaginationQueryShape = {
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
} as const;

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

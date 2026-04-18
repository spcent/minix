import type { Hono, MiddlewareHandler } from "hono";
import { z } from "zod";

import { parseJsonBody, parseQuery } from "../../http/parsing";
import type { ApiBindings, ApiStore } from "../../types";
import { createProviderReadinessSummary } from "./provider-readiness";
import {
  appendOperationalAuditRecord,
  cloneOperationalState,
  createOperationalDiagnosticsResponse,
  ensureOperationalBackfill,
  syncOperationalDomainSchemas,
} from "./jobs";

const opsDiagnosticsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  includeCompletedJobs: z.coerce.boolean().optional(),
});

const opsRunJobsRequestSchema = z.object({
  kind: z.enum(["upload_cleanup", "payment_reconciliation", "notification_retry", "cancellation_expiry"]).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export interface RegisterOpsRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
  resolveStore: (env: ApiBindings | undefined) => ApiStore;
  authSmsProviderConfigured: boolean;
  authOAuthProviderConfigured: boolean;
  runOperationalJobs: (
    store: ApiStore,
    input: {
      userId: string;
      kind?: "upload_cleanup" | "payment_reconciliation" | "notification_retry" | "cancellation_expiry";
      limit?: number;
    },
  ) => Promise<{
    userState: Awaited<ReturnType<ApiStore["getUserState"]>>;
    operationalState: Awaited<ReturnType<ApiStore["getOperationalState"]>>;
    jobs: unknown[];
  }>;
}

export function registerOpsRoutes(options: RegisterOpsRoutesOptions) {
  const {
    app,
    requireSession,
    resolveStore,
    authSmsProviderConfigured,
    authOAuthProviderConfigured,
    runOperationalJobs,
  } = options;

  app.use("/ops", requireSession);
  app.use("/ops/*", requireSession);

  app.get("/ops/diagnostics", async (c) => {
    const traceId = c.get("traceId");
    const query = parseQuery(new URL(c.req.url), opsDiagnosticsQuerySchema, traceId);
    if (query instanceof Response) {
      return query;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    const operationalState = cloneOperationalState(await store.getOperationalState());
    const nowIso = new Date().toISOString();
    ensureOperationalBackfill(operationalState, nowIso);
    syncOperationalDomainSchemas(operationalState, {
      userId: session.userId,
      userState,
      nowIso,
    });
    const providerReadiness = createProviderReadinessSummary({
      env: c.env,
      authSmsProviderConfigured,
      authOAuthProviderConfigured,
    });
    await store.saveOperationalState(operationalState);
    return c.json(
      createOperationalDiagnosticsResponse(userState, operationalState, {
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.includeCompletedJobs !== undefined ? { includeCompletedJobs: query.includeCompletedJobs } : {}),
        providerReadiness,
      }),
    );
  });

  app.post("/ops/jobs/run", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, opsRunJobsRequestSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const result = await runOperationalJobs(store, {
      userId: session.userId,
      ...(payload.kind ? { kind: payload.kind } : {}),
      ...(payload.limit !== undefined ? { limit: payload.limit } : {}),
    });
    appendOperationalAuditRecord(result.operationalState, {
      category: "governance",
      action: "jobs_run_requested",
      message: `Manual operational job run processed ${result.jobs.length} jobs.`,
      createdAt: new Date().toISOString(),
      userId: session.userId,
      metadata: {
        processedJobs: result.jobs.length,
        ...(payload.kind ? { filtered: true, jobKind: payload.kind } : { filtered: false }),
      },
    });
    await store.saveOperationalState(result.operationalState);
    const providerReadiness = createProviderReadinessSummary({
      env: c.env,
      authSmsProviderConfigured,
      authOAuthProviderConfigured,
    });
    return c.json({
      processedJobs: result.jobs,
      diagnostics: createOperationalDiagnosticsResponse(result.userState, result.operationalState, {
        limit: Math.max(payload.limit ?? 20, result.jobs.length || 1),
        includeCompletedJobs: true,
        providerReadiness,
      }),
    });
  });
}

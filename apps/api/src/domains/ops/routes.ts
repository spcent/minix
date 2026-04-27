import { z } from "zod";

import { parseRouteBody, parseRouteQuery } from "../../http/route-context";
import { OPERATIONAL_JOB_KINDS, type ApiStore, type OperationalJobKind } from "../../types";
import type { ApiRouteBaseOptions } from "../route-options";
import { pickDefinedApiFields } from "../schema-helpers";
import {
  createProviderReadinessEnvironmentSummary,
  createProviderReadinessEvidencePack,
  createProviderReadinessSummary,
} from "./provider-readiness";
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
  kind: z.enum(OPERATIONAL_JOB_KINDS).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export interface RegisterOpsRoutesOptions extends ApiRouteBaseOptions {
  authSmsProviderConfigured: boolean;
  authOAuthProviderConfigured: boolean;
  runOperationalJobs: (
    store: ApiStore,
    input: {
      userId: string;
      kind?: OperationalJobKind;
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
    const query = parseRouteQuery(c, opsDiagnosticsQuerySchema);
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
    const environmentSummary = createProviderReadinessEnvironmentSummary(providerReadiness, c.env?.MINIX_DEPLOY_ENV);
    const evidencePack = createProviderReadinessEvidencePack(providerReadiness, {
      capturedAt: nowIso,
      ...(c.env?.MINIX_DEPLOY_ENV ? { deployEnv: c.env.MINIX_DEPLOY_ENV } : {}),
    });
    await store.saveOperationalState(operationalState);
    return c.json(
      createOperationalDiagnosticsResponse(userState, operationalState, {
        ...pickDefinedApiFields(query, ["limit", "includeCompletedJobs"]),
        providerReadiness,
        environmentSummary,
        evidencePack,
      }),
    );
  });

  app.post("/ops/jobs/run", async (c) => {
    const payload = await parseRouteBody(c, opsRunJobsRequestSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const result = await runOperationalJobs(store, {
      userId: session.userId,
      ...pickDefinedApiFields(payload, ["kind", "limit"]),
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
    const evidenceCapturedAt = new Date().toISOString();
    const environmentSummary = createProviderReadinessEnvironmentSummary(providerReadiness, c.env?.MINIX_DEPLOY_ENV);
    const evidencePack = createProviderReadinessEvidencePack(providerReadiness, {
      capturedAt: evidenceCapturedAt,
      ...(c.env?.MINIX_DEPLOY_ENV ? { deployEnv: c.env.MINIX_DEPLOY_ENV } : {}),
    });
    return c.json({
      processedJobs: result.jobs,
      diagnostics: createOperationalDiagnosticsResponse(result.userState, result.operationalState, {
        limit: Math.max(payload.limit ?? 20, result.jobs.length || 1),
        includeCompletedJobs: true,
        providerReadiness,
        environmentSummary,
        evidencePack,
      }),
    });
  });
}

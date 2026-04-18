import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const apiBaseUrl = process.env.MINIX_API_BASE_URL;
const evidenceOutputPath = process.env.MINIX_REMOTE_EVIDENCE_OUTPUT;
let traceCounter = 0;

if (!apiBaseUrl) {
  console.error("MINIX_API_BASE_URL is required for remote API verification");
  process.exit(1);
}

async function request(path, options = {}) {
  const traceId = options.headers?.["x-trace-id"] ?? `verify_remote_${traceCounter += 1}`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "x-trace-id": traceId,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const echoedTraceId = response.headers.get("x-trace-id");
  if (echoedTraceId !== traceId) {
    throw new Error(`${options.method ?? "GET"} ${path} returned mismatched x-trace-id header: ${echoedTraceId ?? "missing"}`);
  }

  const bodyText = await response.text();
  const json = bodyText ? JSON.parse(bodyText) : undefined;
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed with ${response.status} [trace ${traceId}]: ${bodyText}`);
  }

  return json;
}

async function main() {
  await request("/");
  const session = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      platform: "h5",
      credential: { anonymousId: "host-h5-anonymous" },
    }),
  });

  await request("/items?page=1&pageSize=2", {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      origin: "http://localhost:4173",
    },
  });

  const refreshed = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      platform: "h5",
      refreshToken: session.refreshToken,
    }),
  });

  await request("/membership", {
    headers: {
      authorization: `Bearer ${refreshed.accessToken}`,
    },
  });

  const diagnostics = await request("/ops/diagnostics", {
    headers: {
      authorization: `Bearer ${refreshed.accessToken}`,
    },
  });
  const readiness = diagnostics?.providerReadiness;
  if (!readiness || !readiness.auth || !readiness.messages || !readiness.payment || !readiness.upload || !readiness.share) {
    throw new Error("GET /ops/diagnostics did not expose the expected providerReadiness summary");
  }
  const environmentSummary = diagnostics?.environmentSummary;
  const evidencePack = diagnostics?.evidencePack;
  if (!environmentSummary || !evidencePack || !evidencePack.compareKey) {
    throw new Error("GET /ops/diagnostics did not expose the expected environmentSummary and evidencePack diagnostics");
  }

  const remoteEvidence = {
    apiBaseUrl,
    capturedAt: evidencePack.capturedAt,
    deployEnv: evidencePack.deployEnv ?? environmentSummary.deployEnv ?? "unknown",
    releasePosture: evidencePack.releasePosture ?? environmentSummary.releasePosture,
    compareKey: evidencePack.compareKey,
    comparableStatuses: evidencePack.comparableStatuses ?? environmentSummary.comparableStatuses,
    providerReadiness: readiness,
  };

  if (evidenceOutputPath) {
    await mkdir(dirname(evidenceOutputPath), { recursive: true });
    await writeFile(evidenceOutputPath, `${JSON.stringify(remoteEvidence, null, 2)}\n`, "utf8");
  }

  await request("/auth/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${refreshed.accessToken}`,
    },
    body: JSON.stringify({
      refreshToken: refreshed.refreshToken,
    }),
  });

  if (evidenceOutputPath) {
    console.log(`remote evidence written to ${evidenceOutputPath}`);
  }
  console.log(`remote api verification passed against ${apiBaseUrl}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

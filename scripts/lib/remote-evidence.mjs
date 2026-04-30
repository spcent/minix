import { readFile } from "node:fs/promises";

export function assertRemoteEvidenceShape(value, path, options = {}) {
  if (!value || typeof value !== "object" || !value.compareKey) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }

  if (options.requireProviderReadiness && (!value.providerReadiness || typeof value.providerReadiness !== "object")) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }

  if (options.requireComparableStatuses && (!value.comparableStatuses || typeof value.comparableStatuses !== "object")) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }
}

export function normalizeRemoteEvidence(path, value, label = "remote") {
  return {
    path,
    apiBaseUrl: value.apiBaseUrl ?? "pending",
    capturedAt: value.capturedAt ?? "pending",
    deployEnv: value.deployEnv ?? label,
    releasePosture: value.releasePosture ?? "unknown",
    compareKey: value.compareKey,
    comparableStatuses: value.comparableStatuses,
    providerReadiness: value.providerReadiness,
  };
}

export async function loadRemoteEvidence(path, label = "remote", options = {}) {
  const raw = await readFile(path, "utf8");
  const json = JSON.parse(raw);
  assertRemoteEvidenceShape(json, path, options);
  return normalizeRemoteEvidence(path, json, label);
}

export function flattenProviderReadiness(evidenceItems) {
  const rows = [];
  for (const evidence of evidenceItems.filter(Boolean)) {
    for (const [domain, value] of Object.entries(evidence.providerReadiness ?? {})) {
      const nested = typeof value === "object" && value ? value : {};
      for (const [key, entry] of Object.entries(nested)) {
        rows.push({
          env: evidence.deployEnv,
          area: domain,
          key,
          status: entry?.status ?? "unknown",
          detail: entry?.detail ?? "no detail recorded",
        });
      }
    }
  }
  return rows;
}

export function compareComparableStatuses(baseline, next) {
  const drift = [];
  const keys = new Set([
    ...Object.keys(baseline.comparableStatuses ?? {}),
    ...Object.keys(next.comparableStatuses ?? {}),
  ]);

  for (const key of keys) {
    const left = baseline.comparableStatuses?.[key] ?? "missing";
    const right = next.comparableStatuses?.[key] ?? "missing";
    if (left !== right) {
      drift.push(`${key}: ${left} -> ${right}`);
    }
  }

  return drift;
}

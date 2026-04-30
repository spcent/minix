import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

import { flattenProviderReadiness, loadRemoteEvidence } from "./remote-evidence.mjs";

export function parseReleaseReportArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (token === "--") {
      continue;
    }

    if (!token?.startsWith("--")) {
      throw new Error(`Unexpected argument "${token}". Use --key value pairs.`);
    }

    const key = token.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentCommit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "pending";
  }
}

function escapeTable(value) {
  return String(value ?? "pending").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

export function renderEvidenceSummary(evidence) {
  if (!evidence) {
    return ["- evidence pack: pending", "- API base URL: pending", "- compare key: pending"];
  }

  return [
    `- evidence pack: \`${evidence.path}\``,
    `- API base URL: \`${evidence.apiBaseUrl}\``,
    `- deploy env: \`${evidence.deployEnv}\``,
    `- captured at: \`${evidence.capturedAt}\``,
    `- release posture: \`${evidence.releasePosture}\``,
    `- compare key: \`${evidence.compareKey}\``,
  ];
}

export function renderReadinessTable(evidenceItems) {
  const rows = flattenProviderReadiness(evidenceItems);
  if (rows.length === 0) {
    return [
      "| Env | Area | Key | Status | Detail |",
      "| --- | --- | --- | --- | --- |",
      "| pending | pending | pending | pending | remote evidence not captured |",
    ];
  }

  return [
    "| Env | Area | Key | Status | Detail |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${escapeTable(row.env)} | ${escapeTable(row.area)} | ${escapeTable(row.key)} | ${escapeTable(row.status)} | ${escapeTable(row.detail)} |`,
    ),
  ];
}

export function renderProviderChecklist() {
  return [
    "| Area | Operator fields to fill before close | Decision |",
    "| --- | --- | --- |",
    "| auth | SMS provider, OAuth provider, callback domain, login or bind proof | pending |",
    "| messages | channel owners, polling-only acceptance, inbox or notification proof | pending |",
    "| payment | merchant owner, callback secret confirmation, purchase or refund proof | pending |",
    "| upload | storage provider, review provider, asset host URL, upload or attach proof | pending |",
    "| share | short-link provider, poster provider, deployed URL proof, attribution proof | pending |",
  ];
}

export async function createReleaseReport(options) {
  const releaseName = options.release ?? "v1.0.0-rc.N";
  const commit = options.commit ?? currentCommit();
  const date = options.date ?? today();
  const operator = options.operator ?? "pending";
  const previewEvidence = options["preview-evidence"]
    ? await loadRemoteEvidence(options["preview-evidence"], "preview", { requireProviderReadiness: true })
    : undefined;
  const productionEvidence = options["production-evidence"]
    ? await loadRemoteEvidence(options["production-evidence"], "production", { requireProviderReadiness: true })
    : undefined;
  const evidenceItems = [previewEvidence, productionEvidence].filter(Boolean);

  const lines = [
    `### ${releaseName}`,
    "",
    "- status: pending operator signoff",
    `- commit SHA: \`${commit}\``,
    `- verification date: \`${date}\``,
    `- operator: ${operator}`,
    "",
    "#### Local Gates",
    "",
    `- \`pnpm verify\`: ${options["local-verify"] ?? "pending"}`,
    `- \`pnpm verify:official-integrations\`: ${options["official-integrations"] ?? "pending"}`,
    `- \`pnpm verify:h5:blackbox\`: ${options["h5-blackbox"] ?? "pending"}`,
    `- \`pnpm verify:release\`: ${options["release-gate"] ?? "pending"}`,
    "- `pnpm release:report`: generated",
    "",
    "#### Remote Evidence",
    "",
    "##### Preview",
    "",
    ...renderEvidenceSummary(previewEvidence),
    "",
    "##### Production",
    "",
    ...renderEvidenceSummary(productionEvidence),
    "",
    "#### Provider Readiness",
    "",
    ...renderReadinessTable(evidenceItems),
    "",
    "#### Provider Operator Checklist",
    "",
    ...renderProviderChecklist(),
    "",
    "#### Manual WeChat Gate",
    "",
    `- validator: ${options["wechat-validator"] ?? "pending"}`,
    `- date: ${options["wechat-date"] ?? "pending"}`,
    `- target environment: ${options["wechat-target"] ?? "pending"}`,
    "- `host-wechat`: pending",
    "- `novel-wechat`: pending",
    "- notes: pending",
    "",
    "#### Release Signoff",
    "",
    `- owner: ${options["signoff-owner"] ?? "pending"}`,
    `- decision: ${options.decision ?? "pending"}`,
    "- blockers: pending until provider operator fields and manual WeChat gate are filled",
    "",
    "#### Accepted Deferred Issues",
    "",
    "- none recorded yet",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

export async function writeReleaseReport(options) {
  const output = await createReleaseReport(options);
  if (!options.output) {
    return output;
  }

  await writeFile(options.output, output, "utf8");
  return `release report written to ${options.output}\n`;
}

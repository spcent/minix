import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);

function parseArgs(values) {
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

async function loadEvidence(path, label) {
  if (!path) {
    return undefined;
  }

  const raw = await readFile(path, "utf8");
  const json = JSON.parse(raw);
  if (!json?.providerReadiness || !json?.compareKey) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }

  return {
    label,
    path,
    apiBaseUrl: json.apiBaseUrl ?? "pending",
    capturedAt: json.capturedAt ?? "pending",
    deployEnv: json.deployEnv ?? label,
    releasePosture: json.releasePosture ?? "unknown",
    compareKey: json.compareKey,
    providerReadiness: json.providerReadiness,
  };
}

function escapeTable(value) {
  return String(value ?? "pending").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function renderEvidenceSummary(evidence) {
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

function flattenReadiness(evidenceItems) {
  const rows = [];
  for (const evidence of evidenceItems.filter(Boolean)) {
    for (const [domain, value] of Object.entries(evidence.providerReadiness)) {
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

function renderReadinessTable(evidenceItems) {
  const rows = flattenReadiness(evidenceItems);
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

function renderProviderChecklist() {
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

async function main() {
  const options = parseArgs(args);
  const releaseName = options.release ?? "v1.0.0-rc.N";
  const commit = options.commit ?? currentCommit();
  const date = options.date ?? today();
  const operator = options.operator ?? "pending";
  const previewEvidence = await loadEvidence(options["preview-evidence"], "preview");
  const productionEvidence = await loadEvidence(options["production-evidence"], "production");
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

  const output = `${lines.join("\n")}\n`;
  if (options.output) {
    await writeFile(options.output, output, "utf8");
    console.log(`release report written to ${options.output}`);
    return;
  }

  process.stdout.write(output);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

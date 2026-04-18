import { readFile } from "node:fs/promises";

const paths = process.argv.slice(2);

if (paths.length < 2) {
  console.error("usage: node scripts/compare-remote-evidence.mjs <evidence-a.json> <evidence-b.json> [evidence-c.json...]");
  process.exit(1);
}

async function loadEvidence(path) {
  const raw = await readFile(path, "utf8");
  const json = JSON.parse(raw);
  if (!json?.compareKey || !json?.comparableStatuses) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }
  return {
    path,
    deployEnv: json.deployEnv ?? "unknown",
    releasePosture: json.releasePosture ?? "unknown",
    compareKey: json.compareKey,
    comparableStatuses: json.comparableStatuses,
  };
}

function compareEvidence(baseline, next) {
  const drift = [];
  const keys = new Set([...Object.keys(baseline.comparableStatuses), ...Object.keys(next.comparableStatuses)]);
  for (const key of keys) {
    const left = baseline.comparableStatuses[key] ?? "missing";
    const right = next.comparableStatuses[key] ?? "missing";
    if (left !== right) {
      drift.push(`${key}: ${left} -> ${right}`);
    }
  }

  return drift;
}

async function main() {
  const evidenceItems = await Promise.all(paths.map((path) => loadEvidence(path)));
  const baseline = evidenceItems[0];

  console.log(`baseline: ${baseline.path} (${baseline.deployEnv}, ${baseline.releasePosture})`);
  for (const item of evidenceItems.slice(1)) {
    const drift = compareEvidence(baseline, item);
    console.log(`compare: ${item.path} (${item.deployEnv}, ${item.releasePosture})`);
    if (drift.length === 0) {
      console.log("  no drift detected");
      continue;
    }

    for (const line of drift) {
      console.log(`  ${line}`);
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

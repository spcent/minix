import { compareComparableStatuses, loadRemoteEvidence } from "./lib/remote-evidence.mjs";

const paths = process.argv.slice(2);

if (paths.length < 2) {
  console.error("usage: node scripts/compare-remote-evidence.mjs <evidence-a.json> <evidence-b.json> [evidence-c.json...]");
  process.exit(1);
}

async function main() {
  const evidenceItems = await Promise.all(
    paths.map((path) => loadRemoteEvidence(path, "remote", { requireComparableStatuses: true })),
  );
  const baseline = evidenceItems[0];

  console.log(`baseline: ${baseline.path} (${baseline.deployEnv}, ${baseline.releasePosture})`);
  for (const item of evidenceItems.slice(1)) {
    const drift = compareComparableStatuses(baseline, item);
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

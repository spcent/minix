import { flattenProviderReadiness, loadRemoteEvidence } from "./lib/remote-evidence.mjs";

const [path, labelArg] = process.argv.slice(2);

if (!path) {
  console.error("usage: node scripts/render-remote-evidence-log.mjs <evidence.json> [label]");
  process.exit(1);
}

async function main() {
  const evidence = await loadRemoteEvidence(path, labelArg ?? "remote", { requireProviderReadiness: true });
  const label = labelArg ?? evidence.deployEnv ?? "remote";

  console.log(`- ${label} evidence pack path: \`${path}\``);
  console.log(`- ${label} rollout posture: \`${evidence.releasePosture ?? "unknown"}\``);
  console.log(`- ${label} compare key: \`${evidence.compareKey}\``);
  console.log(`- ${label} \`/ops/diagnostics\` provider-readiness:`);

  for (const row of flattenProviderReadiness([evidence])) {
    console.log(`  - ${row.area}.${row.key}: \`${row.status}\` - ${row.detail}`);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

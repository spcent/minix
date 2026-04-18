import { readFile } from "node:fs/promises";

const [path, labelArg] = process.argv.slice(2);

if (!path) {
  console.error("usage: node scripts/render-remote-evidence-log.mjs <evidence.json> [label]");
  process.exit(1);
}

async function main() {
  const raw = await readFile(path, "utf8");
  const json = JSON.parse(raw);
  const label = labelArg ?? json.deployEnv ?? "remote";

  if (!json?.providerReadiness || !json?.compareKey) {
    throw new Error(`${path} is not a valid remote evidence pack`);
  }

  console.log(`- ${label} evidence pack path: \`${path}\``);
  console.log(`- ${label} rollout posture: \`${json.releasePosture ?? "unknown"}\``);
  console.log(`- ${label} compare key: \`${json.compareKey}\``);
  console.log(`- ${label} \`/ops/diagnostics\` provider-readiness:`);

  for (const [domain, value] of Object.entries(json.providerReadiness)) {
    const nested = typeof value === "object" && value ? value : {};
    for (const [key, entry] of Object.entries(nested)) {
      const status = entry?.status ?? "unknown";
      const detail = entry?.detail ?? "no detail recorded";
      console.log(`  - ${domain}.${key}: \`${status}\` - ${detail}`);
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

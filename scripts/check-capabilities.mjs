import { listHostSpecs, loadHostManifestPageEntries, loadRepoSpec, normalizePath } from "./lib/specs.mjs";

const repoRoot = process.cwd();
const CAPABILITY_KINDS = ["clipboard", "device", "location", "payment", "share", "subscription", "upload"];
const knownCapabilities = new Set(CAPABILITY_KINDS);
const capabilitySupport = {
  h5: new Set(["clipboard", "device", "location", "share"]),
  wechat: new Set(["clipboard", "device", "location", "share"]),
};

function inferHostKind(hostSpec) {
  return hostSpec.platform === "wechat" ? "wechat" : "h5";
}

async function main() {
  const repoSpec = await loadRepoSpec();
  const hostApps = listHostSpecs(repoSpec);
  const violations = [];

  for (const hostApp of hostApps) {
    const hostKind = inferHostKind(hostApp);
    const supportedCapabilities = capabilitySupport[hostKind];
    const pageEntries = await loadHostManifestPageEntries(hostApp);

    for (const entry of pageEntries) {
      if (entry.requiredCapabilities === undefined) {
        continue;
      }

      if (!Array.isArray(entry.requiredCapabilities)) {
        violations.push({
          filePath: hostApp.dir,
          reason: `${hostApp.name}.${entry.pageKey} requiredCapabilities must be an array`,
        });
        continue;
      }

      for (const requirement of entry.requiredCapabilities) {
        if (!requirement || typeof requirement !== "object") {
          violations.push({
            filePath: hostApp.dir,
            reason: `${hostApp.name}.${entry.pageKey} requiredCapabilities entries must be objects`,
          });
          continue;
        }

        const capability = requirement.capability;
        if (typeof capability !== "string" || !knownCapabilities.has(capability)) {
          violations.push({
            filePath: hostApp.dir,
            reason: `${hostApp.name}.${entry.pageKey} declares unknown capability "${String(capability)}"`,
          });
          continue;
        }

        if (requirement.required !== false && !supportedCapabilities.has(capability)) {
          violations.push({
            filePath: hostApp.dir,
            reason: `${hostApp.name}.${entry.pageKey} requires unsupported ${hostKind} capability "${capability}"`,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log(`capability check passed for ${hostApps.length} host apps`);
    return;
  }

  console.error("capability check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(violation.filePath.replace(`${repoRoot}/`, ""));
    console.error(`- ${relativePath}: ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();

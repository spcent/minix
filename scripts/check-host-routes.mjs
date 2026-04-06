import path from "node:path";
import {
  listHostSpecs,
  loadHostManifestObject,
  loadHostManifestPageEntries,
  loadHostRouteKeyMap,
  loadRepoSpec,
  loadRouteContractEntries,
  normalizePath,
  resolveHostFile,
} from "./lib/specs.mjs";

const repoRoot = process.cwd();

function compareMaps(expectedEntries, actualObject) {
  const expected = new Map(expectedEntries);
  const actual = new Map(Object.entries(actualObject ?? {}));

  return {
    missing: Array.from(expected.entries()).filter(([key]) => !actual.has(key)),
    extra: Array.from(actual.entries()).filter(([key]) => !expected.has(key)),
    mismatched: Array.from(expected.entries()).filter(([key, value]) => actual.has(key) && actual.get(key) !== value),
  };
}

function compareSets(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: expected.filter((item) => !actualSet.has(item)),
    extra: actual.filter((item) => !expectedSet.has(item)),
  };
}

async function main() {
  const repoSpec = await loadRepoSpec();
  const hostApps = listHostSpecs(repoSpec);
  const routeIds = await loadRouteContractEntries(repoSpec);
  const routeValueToKey = new Map(routeIds.map((routeId) => [routeId.routeId, routeId.routeKey]));
  const violations = [];

  for (const hostApp of hostApps) {
    const relativeAppDir = normalizePath(path.relative(repoRoot, hostApp.dir));
    const pageManifestPath = resolveHostFile(hostApp, hostApp.manifest.page_manifest_module);
    const manifestPath = resolveHostFile(hostApp, hostApp.manifest.app_module);
    const routesPath = resolveHostFile(hostApp, hostApp.manifest.routes_module);

    const pageManifest = await loadHostManifestPageEntries(hostApp);
    const appManifest = await loadHostManifestObject(hostApp);
    const routeKeyMap = await loadHostRouteKeyMap(hostApp);
    const manifestRouteValues = new Set(pageManifest.map((page) => page.routeId));

    for (const routeId of manifestRouteValues) {
      if (!routeValueToKey.has(routeId)) {
        violations.push({
          filePath: pageManifestPath,
          reason: `${relativeAppDir} page manifest maps unknown route id "${routeId}"`,
        });
      }
    }

    const pageKeys = pageManifest.map((entry) => entry.pageKey);
    const definitionKeys = Object.keys(appManifest.pageDefinitions ?? {});
    const definitionDiff = compareSets(pageKeys, definitionKeys);
    for (const missing of definitionDiff.missing) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pageDefinitions is missing page "${missing}"`,
      });
    }
    for (const extra of definitionDiff.extra) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pageDefinitions has extra page "${extra}"`,
      });
    }

    const pageManifestDiff = compareMaps(
      pageManifest.map((entry) => [entry.pageKey, entry.routeId]),
      Object.fromEntries(
        Object.entries(appManifest.pageManifest ?? {}).map(([pageKey, entry]) => [pageKey, entry?.routeId]),
      ),
    );
    for (const [pageKey] of pageManifestDiff.missing) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pageManifest is missing page "${pageKey}"`,
      });
    }
    for (const [pageKey] of pageManifestDiff.extra) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pageManifest has extra page "${pageKey}"`,
      });
    }
    for (const [pageKey] of pageManifestDiff.mismatched) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pageManifest route mapping for "${pageKey}" diverges from page-manifest.ts`,
      });
    }

    const routesDiff = compareMaps(
      pageManifest.map((entry) => [entry.routeId, entry.routePath]),
      appManifest.routes,
    );
    for (const [routeId] of routesDiff.missing) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest routes is missing route id "${routeId}"`,
      });
    }
    for (const [routeId] of routesDiff.extra) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest routes has extra route id "${routeId}"`,
      });
    }
    for (const [routeId] of routesDiff.mismatched) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest routes path for "${routeId}" diverges from page-manifest.ts`,
      });
    }

    const routeKeyMapDiff = compareMaps(
      pageManifest
        .map((entry) => {
          const routeKey = routeValueToKey.get(entry.routeId);
          return routeKey ? [routeKey, entry.routePath] : null;
        })
        .filter(Boolean),
      routeKeyMap,
    );
    for (const [routeKey] of routeKeyMapDiff.missing) {
      violations.push({
        filePath: routesPath,
        reason: `${relativeAppDir} routes export is missing route key "${routeKey}"`,
      });
    }
    for (const [routeKey] of routeKeyMapDiff.extra) {
      violations.push({
        filePath: routesPath,
        reason: `${relativeAppDir} routes export has extra route key "${routeKey}"`,
      });
    }
    for (const [routeKey] of routeKeyMapDiff.mismatched) {
      violations.push({
        filePath: routesPath,
        reason: `${relativeAppDir} routes export path for "${routeKey}" diverges from page-manifest.ts`,
      });
    }

    if (hostApp.miniprogram.page_mode === "required_aligned") {
      for (const entry of pageManifest) {
        if (!entry.miniprogramPage) {
          violations.push({
            filePath: pageManifestPath,
            reason: `${relativeAppDir} page manifest entry "${entry.pageKey}" is missing miniprogramPage`,
          });
          continue;
        }

        if (`/${entry.miniprogramPage}` !== entry.routePath) {
          violations.push({
            filePath: pageManifestPath,
            reason: `${relativeAppDir} page manifest entry "${entry.pageKey}" must keep routePath and miniprogramPage aligned`,
          });
        }
      }
    } else if (hostApp.miniprogram.page_mode === "forbidden") {
      for (const entry of pageManifest) {
        if (entry.miniprogramPage != null) {
          violations.push({
            filePath: pageManifestPath,
            reason: `${relativeAppDir} page manifest entry "${entry.pageKey}" must not define miniprogramPage`,
          });
        }
      }
    }

    for (const entry of pageManifest) {
      const routeKey = routeValueToKey.get(entry.routeId);
      if (!routeKey) {
        continue;
      }

      if (entry.pageKey !== routeKey) {
        violations.push({
          filePath: pageManifestPath,
          reason: `${relativeAppDir} page manifest entry "${entry.pageKey}" must use the same page key and route key`,
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`host route check passed for ${hostApps.length} host apps`);
    return;
  }

  console.error("host route check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}: ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();

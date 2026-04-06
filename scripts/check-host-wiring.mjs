import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  listHostSpecs,
  loadHostManifestObject,
  loadHostManifestPageEntries,
  loadHostMiniprogramPages,
  loadHostPageConfigKeys,
  loadHostPageRegistryKeys,
  loadHostRenderRegistryKeys,
  loadHostShellRegistryKeys,
  loadRepoSpec,
  loadRouteContractEntries,
  normalizePath,
  resolveHostFile,
} from "./lib/specs.mjs";

const repoRoot = process.cwd();

async function parseNamedPageModules(pagesDir) {
  const entries = await readdir(pagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name.replace(/\.ts$/, ""));
}

async function parseMiniprogramPages(pagesDir) {
  const entries = await readdir(pagesDir, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    try {
      await readFile(path.join(pagesDir, entry.name, "index.ts"), "utf8");
      pages.push(entry.name);
    } catch {
      // ignore directories without import-only page shells
    }
  }

  return pages;
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
  const violations = [];
  const repoSpec = await loadRepoSpec();
  const hostApps = listHostSpecs(repoSpec);
  const routeEntries = await loadRouteContractEntries(repoSpec);
  const routeIdToKey = new Map(routeEntries.map((entry) => [entry.routeId, entry.routeKey]));

  for (const hostApp of hostApps) {
    const relativeAppDir = normalizePath(path.relative(repoRoot, hostApp.dir));
    const manifestPath = resolveHostFile(hostApp, hostApp.manifest.app_module);

    const appManifest = await loadHostManifestObject(hostApp);
    const manifestPages = await loadHostPageConfigKeys(hostApp);
    const registryPages = await loadHostPageRegistryKeys(hostApp);
    const pageManifestEntries = await loadHostManifestPageEntries(hostApp);
    const hostPageKeys = pageManifestEntries.map((entry) => entry.pageKey);
    const manifestRouteKeys = pageManifestEntries
      .map((entry) => routeIdToKey.get(entry.routeId))
      .filter((routeKey) => routeKey);

    const routePairs = [
      ["host route pages", hostPageKeys, registryPages, resolveHostFile(hostApp, hostApp.registry.page_module)],
    ];

    for (const [expectedLabel, expected, actual, filePath] of routePairs) {
      const diff = compareSets(expected, actual);

      for (const missing of diff.missing) {
        violations.push({
          filePath,
          reason: `${relativeAppDir} is missing "${missing}" in ${expectedLabel} alignment`,
        });
      }

      for (const extra of diff.extra) {
        violations.push({
          filePath,
          reason: `${relativeAppDir} has extra "${extra}" outside ${expectedLabel} alignment`,
        });
      }
    }

    const manifestDiff = compareSets(manifestRouteKeys, manifestPages);
    for (const missing of manifestDiff.missing) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} source page definitions is missing configurable route "${missing}"`,
      });
    }

    for (const extra of manifestDiff.extra) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} source page definitions has extra entry "${extra}" outside configured route mappings`,
      });
    }

    const runtimePages = Object.keys(appManifest.pages ?? {});
    const runtimePagesDiff = compareSets(manifestPages, runtimePages);
    for (const missing of runtimePagesDiff.missing) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pages is missing "${missing}" from source page-definition coverage`,
      });
    }

    for (const extra of runtimePagesDiff.extra) {
      violations.push({
        filePath: manifestPath,
        reason: `${relativeAppDir} app manifest pages has extra "${extra}" outside source page-definition coverage`,
      });
    }

    if (hostApp.render?.registry_module) {
      const customRenderPages = pageManifestEntries
        .filter((entry) => entry.renderMode === hostApp.render.custom_mode)
        .map((entry) => entry.pageKey);
      const renderRegistryKeys = await loadHostRenderRegistryKeys(hostApp);
      const renderDiff = compareSets(customRenderPages, renderRegistryKeys);

      for (const missing of renderDiff.missing) {
        violations.push({
          filePath: resolveHostFile(hostApp, hostApp.render.registry_module),
          reason: `${relativeAppDir} is missing custom renderer "${missing}" in h5 render registry alignment`,
        });
      }

      for (const extra of renderDiff.extra) {
        violations.push({
          filePath: resolveHostFile(hostApp, hostApp.render.registry_module),
          reason: `${relativeAppDir} has extra custom renderer "${extra}" outside h5 render registry alignment`,
        });
      }
    }

    if (hostApp.registry.shell_module) {
      const shellPagesDir = resolveHostFile(hostApp, hostApp.registry.shell_pages_dir);
      const miniprogramPagesDir = resolveHostFile(hostApp, hostApp.miniprogram.pages_dir);
      const shellRegistryPages = await loadHostShellRegistryKeys(hostApp);
      const shellPageModules = await parseNamedPageModules(shellPagesDir);
      const miniprogramPages = await parseMiniprogramPages(miniprogramPagesDir);
      const manifestMiniprogramPages = await loadHostMiniprogramPages(hostApp);
      const expectedMiniprogramPages = pageManifestEntries
        .map((entry) => entry.miniprogramPage)
        .filter((entry) => typeof entry === "string");

      const wechatPairs = [
        ["wechat shell pages", hostPageKeys, shellRegistryPages, resolveHostFile(hostApp, hostApp.registry.shell_module)],
        ["wechat shell pages", hostPageKeys, shellPageModules, shellPagesDir],
        ["wechat shell pages", hostPageKeys, miniprogramPages, miniprogramPagesDir],
        ["wechat miniprogram pages", expectedMiniprogramPages, manifestMiniprogramPages, resolveHostFile(hostApp, hostApp.manifest.miniprogram_pages_module)],
      ];

      for (const [expectedLabel, expected, actual, filePath] of wechatPairs) {
        const diff = compareSets(expected, actual);

        for (const missing of diff.missing) {
          violations.push({
            filePath,
            reason: `${relativeAppDir} is missing "${missing}" in ${expectedLabel} alignment`,
          });
        }

        for (const extra of diff.extra) {
          violations.push({
            filePath,
            reason: `${relativeAppDir} has extra "${extra}" outside ${expectedLabel} alignment`,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log(`host wiring check passed for ${hostApps.length} host apps`);
    return;
  }

  console.error("host wiring check failed:");
  for (const violation of violations) {
    const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
    console.error(`- ${relativePath}: ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();

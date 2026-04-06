import path from "node:path";
import {
  listHostSpecs,
  loadDependencyRulesSpec,
  loadHostManifestObject,
  loadHostManifestPageEntries,
  loadHostMiniprogramPages,
  loadHostPageConfigKeys,
  loadHostPageRegistryKeys,
  loadHostRenderRegistryKeys,
  loadHostShellRegistryKeys,
  loadHostRouteKeyMap,
  loadRepoSpec,
  loadRouteContractEntries,
  normalizePath,
  pathExists,
  resolveHostFile,
} from "./lib/specs.mjs";

const repoRoot = process.cwd();

function pushViolation(violations, filePath, reason) {
  violations.push({
    filePath,
    reason,
  });
}

async function validateDependencyRulesSpec(dependencyRulesSpec, violations) {
  const knownLayers = new Set(Object.keys(dependencyRulesSpec.layers));

  for (const [layerName, layerSpec] of Object.entries(dependencyRulesSpec.layers)) {
    for (const relation of ["may_depend_on", "may_not_depend_on"]) {
      for (const referencedLayer of layerSpec[relation] ?? []) {
        if (!knownLayers.has(referencedLayer)) {
          pushViolation(
            violations,
            "specs/dependency-rules.yaml",
            `layers.${layerName}.${relation} references unknown layer "${referencedLayer}"`,
          );
        }
      }
    }
  }
}

async function validateRepoSpecPaths(repoSpec, violations) {
  const requiredPaths = [
    ...repoSpec.package_shapes.shared_packages,
    ...repoSpec.package_shapes.host_apps,
    repoSpec.package_shapes.feature_workspace.root,
    repoSpec.host_wiring.route_contract.module,
  ];

  for (const relativePath of requiredPaths) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!(await pathExists(absolutePath))) {
      pushViolation(violations, relativePath, `path does not exist`);
    }
  }

  const declaredHostApps = new Set(repoSpec.package_shapes.host_apps.map((entry) => entry.replace(/^apps\//, "")));
  const configuredHosts = new Set(Object.keys(repoSpec.host_wiring.hosts));

  for (const hostName of configuredHosts) {
    if (!declaredHostApps.has(hostName)) {
      pushViolation(violations, "specs/repo.yaml", `host_wiring.hosts.${hostName} is not listed in package_shapes.host_apps`);
    }
  }

  for (const hostName of declaredHostApps) {
    if (!configuredHosts.has(hostName)) {
      pushViolation(violations, "specs/repo.yaml", `package_shapes.host_apps includes "${hostName}" but host_wiring.hosts.${hostName} is missing`);
    }
  }
}

async function validateHostSpecModules(repoSpec, violations) {
  const hostSpecs = listHostSpecs(repoSpec);

  await loadRouteContractEntries(repoSpec);

  for (const hostSpec of hostSpecs) {
    const requiredFiles = [
      hostSpec.manifest.source_module,
      hostSpec.manifest.app_module,
      hostSpec.manifest.page_manifest_module,
      hostSpec.manifest.page_config_module,
      hostSpec.manifest.routes_module,
      hostSpec.runtime.env_module,
      hostSpec.runtime.mock_api_module,
      hostSpec.registry.page_module,
    ];

    if (hostSpec.registry.shell_module) {
      requiredFiles.push(hostSpec.registry.shell_module);
    }

    if (hostSpec.registry.shell_pages_dir) {
      requiredFiles.push(hostSpec.registry.shell_pages_dir);
    }

    if (hostSpec.render?.registry_module) {
      requiredFiles.push(hostSpec.render.registry_module);
    }

    if (hostSpec.miniprogram.pages_dir) {
      requiredFiles.push(hostSpec.miniprogram.pages_dir);
    }

    if (hostSpec.manifest.miniprogram_pages_module) {
      requiredFiles.push(hostSpec.manifest.miniprogram_pages_module);
    }

    for (const relativePath of requiredFiles) {
      const absolutePath = resolveHostFile(hostSpec, relativePath);
      if (!(await pathExists(absolutePath))) {
        pushViolation(violations, path.relative(repoRoot, absolutePath), `configured host path does not exist`);
      }
    }

    try {
      await loadHostManifestObject(hostSpec);
      await loadHostManifestPageEntries(hostSpec);
      await loadHostPageConfigKeys(hostSpec);
      await loadHostRouteKeyMap(hostSpec);
      await loadHostPageRegistryKeys(hostSpec);

      if (hostSpec.render?.registry_module) {
        await loadHostRenderRegistryKeys(hostSpec);
      }

      if (hostSpec.registry.shell_module) {
        await loadHostShellRegistryKeys(hostSpec);
      }

      if (hostSpec.manifest.miniprogram_pages_module) {
        await loadHostMiniprogramPages(hostSpec);
      }
    } catch (error) {
      pushViolation(
        violations,
        `specs/repo.yaml`,
        `host "${hostSpec.name}" failed module validation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return hostSpecs.length;
}

async function main() {
  const repoSpec = await loadRepoSpec();
  const dependencyRulesSpec = await loadDependencyRulesSpec();
  const violations = [];

  await validateRepoSpecPaths(repoSpec, violations);
  await validateDependencyRulesSpec(dependencyRulesSpec, violations);
  const hostCount = await validateHostSpecModules(repoSpec, violations);

  if (violations.length === 0) {
    console.log(`spec check passed for ${hostCount} host specs and ${Object.keys(dependencyRulesSpec.layers).length} dependency layers`);
    return;
  }

  console.error("spec check failed:");
  for (const violation of violations) {
    console.error(`- ${normalizePath(violation.filePath)}: ${violation.reason}`);
  }

  process.exitCode = 1;
}

await main();

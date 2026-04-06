import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeTempFile(root: string, relativePath: string, contents: string) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, contents, "utf8");
}

export async function writeDefaultRepoSpec(root: string) {
  await writeTempFile(
    root,
    "specs/repo.yaml",
    `version: 1

package_shapes:
  feature_workspace:
    root: packages/features
  host_apps:
    - apps/host-wechat
    - apps/host-h5

host_wiring:
  route_contract:
    module: packages/contracts/src/routes/app.ts
    export: APP_ROUTE_IDS
  hosts:
    host-h5:
      dir: apps/host-h5
      platform: h5
      manifest:
        source_module: src/manifest/page-definitions.ts
        feature_flags_export: hostH5FeatureFlags
        page_definitions_export: hostH5PageDefinitions
        app_module: src/manifest/app.manifest.ts
        app_export: hostH5Manifest
        page_manifest_module: src/manifest/page-manifest.ts
        page_manifest_export: hostH5PageManifest
        page_config_module: src/manifest/page-config.ts
        page_config_export: hostH5ManifestPages
        route_map_export: hostH5Routes
        routes_module: src/manifest/routes.ts
        routes_export: HOST_H5_ROUTES
      runtime:
        platform_package: "@minix/platform-h5"
        create_adapters_export: createH5Adapters
        env_module: src/bootstrap/env.ts
        load_env_export: loadHostH5Env
        mock_api_module: src/bootstrap/mock-api.ts
        create_mock_api_export: createHostH5MockApiAdapter
      registry:
        page_module: src/registrations/page-registry.ts
        page_export: hostH5PageRegistryFactories
      render:
        custom_mode: custom
        registry_module: src/render/page-registry.ts
        registry_export: hostH5PageRenderers
      miniprogram:
        page_mode: forbidden
    host-wechat:
      dir: apps/host-wechat
      platform: wechat
      manifest:
        source_module: src/manifest/page-definitions.ts
        feature_flags_export: hostWechatFeatureFlags
        page_definitions_export: hostWechatPageDefinitions
        app_module: src/manifest/app.manifest.ts
        app_export: hostWechatManifest
        page_manifest_module: src/manifest/page-manifest.ts
        page_manifest_export: hostWechatPageManifest
        page_config_module: src/manifest/page-config.ts
        page_config_export: hostWechatManifestPages
        route_map_export: hostWechatRoutes
        routes_module: src/manifest/routes.ts
        routes_export: HOST_WECHAT_ROUTES
        miniprogram_pages_module: src/manifest/page-manifest.ts
        miniprogram_pages_export: HOST_WECHAT_MINIPROGRAM_PAGES
      runtime:
        platform_package: "@minix/platform-wechat"
        create_adapters_export: createWechatAdapters
        env_module: src/bootstrap/env.ts
        load_env_export: loadHostWechatEnv
        mock_api_module: src/bootstrap/mock-api.ts
        create_mock_api_export: createHostWechatMockApiAdapter
      registry:
        page_module: src/registrations/page-registry.ts
        page_export: hostWechatPageRegistryFactories
        shell_module: src/registrations/wechat/page-registry.ts
        shell_export: hostWechatShellPageRegistry
        shell_pages_dir: src/registrations/wechat/pages
      miniprogram:
        page_mode: required_aligned
        pages_dir: miniprogram/pages
`,
  );
}

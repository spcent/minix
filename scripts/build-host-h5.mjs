import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build, context } from "esbuild";

function resolveHostH5Paths(repoRoot = process.cwd()) {
  const appDir = path.join(repoRoot, "apps", "host-h5");
  const distDir = path.join(appDir, "dist");
  const assetsDir = path.join(distDir, "assets");
  const publicDir = path.join(appDir, "public");
  const entryFile = path.join(appDir, "src", "render", "main.ts");
  const htmlTemplateFile = path.join(appDir, "public", "index.html");
  const outFile = path.join(assetsDir, "main.js");

  return {
    appDir,
    distDir,
    assetsDir,
    publicDir,
    entryFile,
    htmlTemplateFile,
    outFile,
  };
}

function createHostH5Html(template) {
  const apiBaseUrl = process.env.MINIX_API_BASE_URL;
  const bootstrapScript = apiBaseUrl
    ? `<script>\nwindow.__MINIX_BOOTSTRAP_ENV__ = {\n  ...(window.__MINIX_BOOTSTRAP_ENV__ ?? {}),\n  apiBaseUrl: ${JSON.stringify(apiBaseUrl)}\n};\n</script>`
    : "";

  return template
    .replace("<div id=\"app\"></div>", `<div id="app"></div>\n    ${bootstrapScript}`.trimEnd())
    .replace("./src/render/main.ts", "./assets/main.js");
}

async function writeHostH5Html(distDir, templateFile) {
  const template = await readFile(templateFile, "utf8");
  await writeFile(path.join(distDir, "index.html"), createHostH5Html(template), "utf8");
}

async function syncPublicFiles(publicDir, distDir) {
  const entries = await readdir(publicDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.name !== "index.html")
      .map(async (entry) => {
        const sourcePath = path.join(publicDir, entry.name);
        const targetPath = path.join(distDir, entry.name);
        await rm(targetPath, { recursive: true, force: true });
        await cp(sourcePath, targetPath, { recursive: true });
      }),
  );
}

function createBuildOptions(outFile, logLevel = "info") {
  return {
    entryPoints: [outFile.entryFile ?? outFile],
    outfile: outFile.outFile ?? outFile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    logLevel,
  };
}

export async function buildHostH5(repoRoot = process.cwd()) {
  const paths = resolveHostH5Paths(repoRoot);

  await mkdir(paths.assetsDir, { recursive: true });

  await build(createBuildOptions(paths));
  await syncPublicFiles(paths.publicDir, paths.distDir);
  await writeHostH5Html(paths.distDir, paths.htmlTemplateFile);
  console.log(`host-h5 build written to ${paths.distDir}`);
  return paths.distDir;
}

export async function watchHostH5(repoRoot = process.cwd()) {
  const paths = resolveHostH5Paths(repoRoot);
  await mkdir(paths.assetsDir, { recursive: true });
  await syncPublicFiles(paths.publicDir, paths.distDir);
  await writeHostH5Html(paths.distDir, paths.htmlTemplateFile);

  const buildContext = await context(
    createBuildOptions(paths, "silent"),
  );

  await buildContext.watch();
  console.log(`host-h5 watch active in ${paths.appDir}`);
  console.log(`output directory ${paths.distDir}`);

  return {
    distDir: paths.distDir,
    async dispose() {
      await buildContext.dispose();
    },
  };
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  await buildHostH5();
}

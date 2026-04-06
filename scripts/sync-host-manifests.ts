import { checkHostManifestGeneratedFiles, syncHostManifestGeneratedFiles } from "../packages/tooling/src/host-manifest-compiler";

async function main() {
  const repoRoot = process.cwd();
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    const violations = await checkHostManifestGeneratedFiles(repoRoot);
    if (violations.length > 0) {
      throw new Error(`host manifest generated files are out of sync: ${violations.join(", ")}`);
    }

    console.log("host manifest generated files are in sync");
    return;
  }

  await syncHostManifestGeneratedFiles(repoRoot);
  console.log("synced host manifest generated files");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

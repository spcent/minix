import { checkHostWechatShellFiles, syncHostWechatShellFiles } from "../packages/tooling/src/host-wechat-shells";

async function main() {
  const repoRoot = process.cwd();
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    const violations = await checkHostWechatShellFiles(repoRoot);
    if (violations.length > 0) {
      throw new Error(`host wechat shell files are out of sync: ${violations.join(", ")}`);
    }

    console.log("host wechat shell files are in sync");
    return;
  }

  await syncHostWechatShellFiles(repoRoot);
  console.log("synced host wechat shell files");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

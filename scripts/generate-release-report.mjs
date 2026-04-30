import { parseReleaseReportArgs, writeReleaseReport } from "./lib/release-report.mjs";

const args = process.argv.slice(2);

async function main() {
  const options = parseReleaseReportArgs(args);
  process.stdout.write(await writeReleaseReport(options));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

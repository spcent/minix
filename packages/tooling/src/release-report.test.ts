import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function importReleaseReportModule() {
  return import(pathToFileURL(path.resolve("scripts/lib/release-report.mjs")).href) as Promise<{
    createReleaseReport(options: Record<string, string>): Promise<string>;
    parseReleaseReportArgs(values: string[]): Record<string, string>;
    writeReleaseReport(options: Record<string, string>): Promise<string>;
  }>;
}

async function importRemoteEvidenceModule() {
  return import(pathToFileURL(path.resolve("scripts/lib/remote-evidence.mjs")).href) as Promise<{
    compareComparableStatuses(
      baseline: { comparableStatuses: Record<string, string> },
      next: { comparableStatuses: Record<string, string> },
    ): string[];
    flattenProviderReadiness(
      evidenceItems: Array<{
        deployEnv: string;
        providerReadiness: Record<string, Record<string, { status?: string; detail?: string }>>;
      }>,
    ): Array<{ env: string; area: string; key: string; status: string; detail: string }>;
    loadRemoteEvidence(path: string, label?: string, options?: Record<string, boolean>): Promise<{
      path: string;
      deployEnv: string;
      releasePosture: string;
      compareKey: string;
      comparableStatuses?: Record<string, string>;
      providerReadiness?: Record<string, Record<string, { status?: string; detail?: string }>>;
    }>;
  }>;
}

function sampleEvidence(overrides: Record<string, unknown> = {}) {
  return {
    apiBaseUrl: "https://preview.example.test",
    capturedAt: "2026-04-30T00:00:00.000Z",
    deployEnv: "preview",
    releasePosture: "review",
    compareKey: "preview:review",
    comparableStatuses: {
      "auth.sms": "blocked",
      "upload.pipeline": "ready",
    },
    providerReadiness: {
      auth: {
        sms: {
          status: "blocked",
          detail: "SMS provider is missing.",
        },
      },
      upload: {
        pipeline: {
          status: "ready",
          detail: "Upload storage and review providers are configured.",
        },
      },
    },
    ...overrides,
  };
}

test("release report renders a pending skeleton without remote evidence", async () => {
  const { createReleaseReport } = await importReleaseReportModule();
  const report = await createReleaseReport({
    release: "v1.0.0-rc.1",
    commit: "abc123",
    date: "2026-04-30",
    operator: "release-owner",
    "local-verify": "passed",
  });

  assert.match(report, /### v1\.0\.0-rc\.1/);
  assert.match(report, /commit SHA: `abc123`/);
  assert.match(report, /operator: release-owner/);
  assert.match(report, /\| pending \| pending \| pending \| pending \| remote evidence not captured \|/);
  assert.match(report, /SMS provider, OAuth provider, callback domain/);
});

test("release report expands provider readiness from preview evidence", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-release-report-"));

  try {
    const evidencePath = path.join(tempRoot, "preview.json");
    await writeFile(evidencePath, `${JSON.stringify(sampleEvidence(), null, 2)}\n`, "utf8");

    const { createReleaseReport } = await importReleaseReportModule();
    const report = await createReleaseReport({
      release: "v1.0.0-rc.2",
      commit: "def456",
      date: "2026-04-30",
      "preview-evidence": evidencePath,
    });

    assert.match(report, new RegExp(`evidence pack: \`${evidencePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\``));
    assert.match(report, /API base URL: `https:\/\/preview\.example\.test`/);
    assert.match(report, /\| preview \| auth \| sms \| blocked \| SMS provider is missing\. \|/);
    assert.match(report, /\| preview \| upload \| pipeline \| ready \| Upload storage and review providers are configured\. \|/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("release report rejects evidence without provider readiness", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-release-report-invalid-"));

  try {
    const evidencePath = path.join(tempRoot, "invalid.json");
    await writeFile(evidencePath, `${JSON.stringify({ compareKey: "invalid" }, null, 2)}\n`, "utf8");

    const { createReleaseReport } = await importReleaseReportModule();
    await assert.rejects(
      () =>
        createReleaseReport({
          "preview-evidence": evidencePath,
        }),
      /is not a valid remote evidence pack/,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("release report writes output files through the shared helper", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "minix-release-report-output-"));

  try {
    const outputPath = path.join(tempRoot, "report.md");
    const { writeReleaseReport } = await importReleaseReportModule();
    const message = await writeReleaseReport({
      release: "v1.0.0-rc.3",
      commit: "fed789",
      date: "2026-04-30",
      output: outputPath,
    });

    assert.equal(message, `release report written to ${outputPath}\n`);
    const output = await readFile(outputPath, "utf8");
    assert.match(output, /### v1\.0\.0-rc\.3/);
    assert.match(output, /commit SHA: `fed789`/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("remote evidence helpers flatten readiness and compare status drift", async () => {
  const { compareComparableStatuses, flattenProviderReadiness } = await importRemoteEvidenceModule();
  const rows = flattenProviderReadiness([
    {
      deployEnv: "preview",
      providerReadiness: sampleEvidence().providerReadiness,
    },
  ]);

  assert.deepEqual(rows[0], {
    env: "preview",
    area: "auth",
    key: "sms",
    status: "blocked",
    detail: "SMS provider is missing.",
  });
  assert.deepEqual(
    compareComparableStatuses(
      { comparableStatuses: { "auth.sms": "blocked", "upload.pipeline": "ready" } },
      { comparableStatuses: { "auth.sms": "ready", "upload.pipeline": "ready" } },
    ),
    ["auth.sms: blocked -> ready"],
  );
});

test("release report argument parser skips pnpm argument separator", async () => {
  const { parseReleaseReportArgs } = await importReleaseReportModule();
  assert.deepEqual(parseReleaseReportArgs(["--", "--release", "v1.0.0", "--local-verify", "passed"]), {
    release: "v1.0.0",
    "local-verify": "passed",
  });
});

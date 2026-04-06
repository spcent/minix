import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const apiBaseUrl = "http://127.0.0.1:3000";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function waitForApi(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`timed out waiting for worker api at ${url}`);
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed with ${response.status}: ${body}`);
  }

  return response;
}

async function main() {
  await run("pnpm", ["api:d1:migrate:local"]);

  async function startWorker() {
    const worker = spawn("pnpm", ["dev:api:worker"], {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    });
    await waitForApi(`${apiBaseUrl}/`);
    return worker;
  }

  let worker = await startWorker();

  try {
    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        platform: "h5",
        credential: { anonymousId: "host-h5-anonymous" },
      }),
    });
    const session = await login.json();

    await request("/items?page=1&pageSize=2", {
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        origin: "http://localhost:4173",
      },
    });

    const preflight = await fetch(`${apiBaseUrl}/items`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:4173",
        "access-control-request-method": "GET",
        "access-control-request-headers": "authorization,content-type",
      },
    });

    if (preflight.status !== 204) {
      throw new Error(`expected worker preflight 204, got ${preflight.status}`);
    }

    worker.kill("SIGINT");
    await new Promise((resolve) => worker.once("exit", resolve));
    worker = await startWorker();

    await request("/items?page=1&pageSize=2", {
      headers: {
        authorization: `Bearer ${session.accessToken}`,
      },
    });

    const refresh = await request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        platform: "h5",
        refreshToken: session.refreshToken,
      }),
    });
    const refreshed = await refresh.json();

    const oldRefresh = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "h5",
        refreshToken: session.refreshToken,
      }),
    });

    if (oldRefresh.status !== 401) {
      throw new Error(`expected old refresh token to be rejected, got ${oldRefresh.status}`);
    }

    await request("/auth/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${refreshed.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refreshed.refreshToken }),
    });

    const revokedRefresh = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "h5",
        refreshToken: refreshed.refreshToken,
      }),
    });

    if (revokedRefresh.status !== 401) {
      throw new Error(`expected revoked refresh token to be rejected, got ${revokedRefresh.status}`);
    }

    console.log("worker api verification passed");
  } finally {
    worker.kill("SIGINT");
    await new Promise((resolve) => worker.once("exit", resolve));
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

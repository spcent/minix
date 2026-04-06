import { watchHostH5 } from "./build-host-h5.mjs";
import { startStaticServer } from "./serve-static.mjs";

const port = process.argv[2] ?? "4173";
const watcher = await watchHostH5();
const server = startStaticServer(watcher.distDir, port);

async function shutdown() {
  await watcher.dispose();
  server.close();
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

console.log(`host-h5 dev server running at http://localhost:${port}`);

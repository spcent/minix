import { watchNovelH5 } from "./build-novel-h5.mjs";
import { startStaticServer } from "./serve-static.mjs";

const port = process.argv[2] ?? "4174";
const watcher = await watchNovelH5();
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

console.log(`novel-h5 dev server running at http://localhost:${port}`);

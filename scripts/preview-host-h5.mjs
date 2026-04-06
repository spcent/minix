import { buildHostH5 } from "./build-host-h5.mjs";
import { startStaticServer } from "./serve-static.mjs";

const port = process.argv[2] ?? "4173";
const distDir = await buildHostH5();

console.log("starting preview server...");
startStaticServer(distDir, port);

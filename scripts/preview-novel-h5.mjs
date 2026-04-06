import { buildNovelH5 } from "./build-novel-h5.mjs";
import { startStaticServer } from "./serve-static.mjs";

const port = process.argv[2] ?? "4174";
const distDir = await buildNovelH5();

console.log("starting novel-h5 preview server...");
startStaticServer(distDir, port);

import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

export function startStaticServer(rootArg, portArg = "4173") {
  if (!rootArg) {
    throw new Error("Usage: node scripts/serve-static.mjs <dir> [port]");
  }

  const rootDir = path.resolve(process.cwd(), rootArg);
  const port = Number(portArg ?? "4173");

  const server = http.createServer(async (req, res) => {
    const requestPath = req.url ? decodeURIComponent(req.url.split("?")[0]) : "/";
    const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
    let filePath = path.join(rootDir, normalizedPath);

    try {
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      await access(filePath);
    } catch {
      filePath = path.join(rootDir, "index.html");
    }

    const extension = path.extname(filePath);
    res.setHeader("Content-Type", mimeTypes[extension] ?? "application/octet-stream");
    createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`static server running at http://localhost:${port}`);
    console.log(`serving ${rootDir}`);
  });

  return server;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const rootArg = process.argv[2];
  const portArg = process.argv[3];
  startStaticServer(rootArg, portArg);
}

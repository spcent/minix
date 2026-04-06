import { serve } from "@hono/node-server";

import { createApiApp } from "./app";

const port = Number(process.env.MINIX_API_PORT ?? process.env.PORT ?? 3000);
const app = createApiApp();

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`MiniX API listening on http://localhost:${info.port}`);
  },
);

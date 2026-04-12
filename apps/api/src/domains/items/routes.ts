import type { Hono, MiddlewareHandler } from "hono";

import { listItems } from "../../data";
import { parseQuery } from "../../http/parsing";
import type { ApiBindings } from "../../types";
import { itemsQuerySchema } from "./schemas";

export interface RegisterItemRoutesOptions {
  app: Hono<{ Bindings: ApiBindings }>;
  requireSession: MiddlewareHandler<any>;
}

export function registerItemRoutes(options: RegisterItemRoutesOptions) {
  const { app, requireSession } = options;

  app.use("/items", requireSession);

  app.get("/items", (c) => {
    const query = parseQuery(new URL(c.req.url), itemsQuerySchema, c.get("traceId"));
    if (query instanceof Response) {
      return query;
    }

    return c.json(listItems(query.page, query.pageSize));
  });
}

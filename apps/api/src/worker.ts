import { createApiApp } from "./app";
import type { ApiBindings } from "./types";

const app = createApiApp();

export default {
  fetch(request: Request, env: ApiBindings): Promise<Response> | Response {
    return app.fetch(request, env);
  },
};

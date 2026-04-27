import type { UpdateSettingsRequest } from "@minix/contracts";

import { parseJsonBody } from "../../http/parsing";
import type { ApiStore, SessionRecord } from "../../types";
import type { ApiRouteBaseOptions } from "../route-options";
import type { NotificationChannelProviderRuntimeEnv } from "./state";
import { settingsUpdateSchema } from "./schemas";

export interface RegisterSettingsRoutesOptions extends ApiRouteBaseOptions {
  createSettingsResponse: (
    session: SessionRecord,
    userState: Awaited<ReturnType<ApiStore["getUserState"]>>,
    deployEnv: string | undefined,
    runtimeEnv?: NotificationChannelProviderRuntimeEnv,
  ) => unknown;
  applySettingsUpdate: (
    userState: Awaited<ReturnType<ApiStore["getUserState"]>>,
    update: UpdateSettingsRequest,
    deployEnv: string | undefined,
    runtimeEnv?: NotificationChannelProviderRuntimeEnv,
  ) => unknown;
}

export function registerSettingsRoutes(options: RegisterSettingsRoutesOptions) {
  const { app, requireSession, resolveStore, createSettingsResponse, applySettingsUpdate } = options;

  app.use("/settings", requireSession);

  app.get("/settings", async (c) => {
    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    return c.json(createSettingsResponse(session, userState, c.env?.MINIX_DEPLOY_ENV, c.env));
  });

  app.post("/settings", async (c) => {
    const traceId = c.get("traceId");
    const payload = await parseJsonBody(c.req.raw, settingsUpdateSchema, traceId);
    if (payload instanceof Response) {
      return payload;
    }

    const session = c.get("session");
    const store = resolveStore(c.env);
    const userState = await store.getUserState(session.userId);
    applySettingsUpdate(userState, payload as UpdateSettingsRequest, c.env?.MINIX_DEPLOY_ENV, c.env);
    await store.saveUserState(session.userId, userState);
    return c.json(createSettingsResponse(session, userState, c.env?.MINIX_DEPLOY_ENV, c.env));
  });
}

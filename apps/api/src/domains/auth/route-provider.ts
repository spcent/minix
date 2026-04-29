import type {
  LoginPlatformKind,
  ProviderPostureMode,
} from "@minix/contracts";

import type { ApiBindings } from "../../types";
import { resolveProviderPostureMode } from "../provider-posture";
import type { AuthOAuthProvider } from "./provider";
import { createOAuthProviderLabel } from "./security";
import {
  createOAuthProviderFailureResponse,
  createProviderUnavailableResponse,
} from "./route-responses";

export function resolveSmsProviderMode(env: ApiBindings | undefined): ProviderPostureMode {
  return resolveProviderPostureMode(env?.MINIX_AUTH_SMS_PROVIDER_MODE);
}

export function resolveOAuthProviderMode(env: ApiBindings | undefined): ProviderPostureMode {
  return resolveProviderPostureMode(env?.MINIX_AUTH_OAUTH_PROVIDER_MODE);
}

export async function validateOAuthProviderCallback(
  input: {
    c: {
      status: (code: 400 | 503) => unknown;
      json: (payload: unknown) => Response;
      env: ApiBindings | undefined;
    };
    provider: string;
    purpose?: "login" | "bind";
    state: string;
    providerToken: string;
    providerUserId: string;
    platform: LoginPlatformKind;
  },
  authOAuthProvider?: AuthOAuthProvider,
): Promise<
  | {
      ok: true;
      value: {
        providerLabel: string;
        providerUserId: string;
      };
    }
  | {
      ok: false;
      response: Response;
    }
> {
  if (authOAuthProvider) {
    const validated = await authOAuthProvider.validateCallback(
      {
        provider: input.provider,
        ...(input.purpose ? { purpose: input.purpose } : {}),
        state: input.state,
        providerToken: input.providerToken,
        providerUserId: input.providerUserId,
        platform: input.platform,
        ...(input.c.env?.MINIX_DEPLOY_ENV ? { deployEnv: input.c.env.MINIX_DEPLOY_ENV } : {}),
      },
      input.c.env,
    );
    if (!validated.ok) {
      return {
        ok: false,
        response: createOAuthProviderFailureResponse(input.c, validated.error),
      };
    }
    return {
      ok: true,
      value: {
        providerLabel: validated.value.providerLabel,
        providerUserId: validated.value.providerUserId,
      },
    };
  }

  if (resolveOAuthProviderMode(input.c.env) === "production") {
    return {
      ok: false,
      response: createProviderUnavailableResponse(input.c, "OAuth provider is not configured for production mode."),
    };
  }

  return {
    ok: true,
    value: {
      providerLabel: createOAuthProviderLabel(input.provider),
      providerUserId: input.providerUserId,
    },
  };
}

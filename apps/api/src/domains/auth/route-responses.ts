import { createApiErrorPayload } from "../../http/response";

interface CredentialErrorResponder {
  status: (code: 400 | 423) => unknown;
  json: (payload: unknown) => Response;
}

interface ProviderUnavailableResponder {
  status: (code: 503) => unknown;
  json: (payload: unknown) => Response;
}

interface OAuthProviderFailureResponder {
  status: (code: 400 | 503) => unknown;
  json: (payload: unknown) => Response;
}

export function respondCredentialError(
  c: CredentialErrorResponder,
  code: "LOGIN_FAILED" | "INVALID_ARGUMENT",
  message: string,
  status: 400 | 423,
  credentialProtection: unknown,
) {
  c.status(status);
  return c.json(createApiErrorPayload(code, message, {
    credentialProtection,
  }));
}

export function createProviderUnavailableResponse(
  c: ProviderUnavailableResponder,
  message: string,
  retryAfterSeconds?: number,
) {
  c.status(503);
  return c.json(createApiErrorPayload("PROVIDER_UNAVAILABLE", message, {
    credentialProtection: {
      failureReason: "provider_unavailable",
    },
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  }));
}

export function createOAuthProviderFailureResponse(
  c: OAuthProviderFailureResponder,
  error: {
    message: string;
    failureReason?: "provider_unavailable" | "oauth_token_invalid";
    retryAfterSeconds?: number;
  },
) {
  if (error.failureReason === "provider_unavailable") {
    return createProviderUnavailableResponse(c, error.message, error.retryAfterSeconds);
  }
  c.status(400);
  return c.json(createApiErrorPayload("LOGIN_FAILED", error.message, {
    credentialProtection: {
      failureReason: error.failureReason ?? "oauth_token_invalid",
    },
    ...(error.retryAfterSeconds !== undefined ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
  }));
}

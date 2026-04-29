import { jsonError } from "../../http/response";
import { getRouteTraceId, parseRouteBody } from "../../http/route-context";
import type { RegisterAuthRoutesOptions } from "./routes";
import {
  createUserIdFromCredential,
} from "./identity";
import {
  consumePhoneVerification,
  createCredentialSubject,
  PASSWORD_MAX_FAILED_ATTEMPTS,
  registerPasswordCredential,
} from "./security";
import { passwordCredentialSchema } from "./schemas";
import { respondCredentialError } from "./route-responses";

export function registerAuthPasswordRoutes(options: Pick<RegisterAuthRoutesOptions, "app" | "resolveStore">) {
  const { app, resolveStore } = options;

  app.post("/auth/password/register", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, passwordCredentialSchema);
    if (payload instanceof Response) {
      return payload;
    }

    const subject = createCredentialSubject(payload);
    if (!subject) {
      return jsonError(
        "INVALID_ARGUMENT",
        "password registration requires an account or phone number",
        400,
        traceId,
      );
    }

    const userId = createUserIdFromCredential({
      method: "password",
      ...(payload.account ? { account: payload.account } : {}),
      ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
    });
    const store = resolveStore(c.env);
    const userState = await store.getUserState(userId);
    if (payload.phoneNumber) {
      if (!payload.verificationCode) {
        return jsonError(
          "LOGIN_FAILED",
          "phone password registration requires a verification code",
          400,
          traceId,
        );
      }
      const verified = await consumePhoneVerification({
        userState,
        phoneNumber: payload.phoneNumber,
        purpose: "password_reset",
        verificationCode: payload.verificationCode,
        now: Date.now(),
      });
      if (!verified.ok) {
        await store.saveUserState(userId, userState);
        return respondCredentialError(
          c,
          "LOGIN_FAILED",
          verified.message,
          verified.status,
          verified.protection,
        );
      }
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);

    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });

  app.post("/auth/password/reset", async (c) => {
    const traceId = getRouteTraceId(c);
    const payload = await parseRouteBody(c, passwordCredentialSchema);
    if (payload instanceof Response) {
      return payload;
    }
    if (!payload.phoneNumber || !payload.verificationCode) {
      return jsonError(
        "INVALID_ARGUMENT",
        "password reset requires phone number and verification code",
        400,
        traceId,
      );
    }

    const subject = createCredentialSubject({ phoneNumber: payload.phoneNumber });
    if (!subject) {
      return jsonError("INVALID_ARGUMENT", "password reset requires a valid phone number", 400, traceId);
    }

    const userId = createUserIdFromCredential({
      method: "password",
      phoneNumber: payload.phoneNumber,
    });
    const store = resolveStore(c.env);
    const userState = await store.getUserState(userId);
    const verified = await consumePhoneVerification({
      userState,
      phoneNumber: payload.phoneNumber,
      purpose: "password_reset",
      verificationCode: payload.verificationCode,
      now: Date.now(),
    });
    if (!verified.ok) {
      await store.saveUserState(userId, userState);
      return respondCredentialError(
        c,
        "LOGIN_FAILED",
        verified.message,
        verified.status,
        verified.protection,
      );
    }

    await registerPasswordCredential({
      userState,
      userId,
      subject,
      password: payload.password,
      now: Date.now(),
    });
    await store.saveUserState(userId, userState);
    return c.json({
      userId,
      subject,
      passwordConfigured: true,
      credentialProtection: { remainingAttempts: PASSWORD_MAX_FAILED_ATTEMPTS },
    });
  });
}

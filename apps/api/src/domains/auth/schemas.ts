import { z } from "zod";

export const authRedirectTargetSchema = z.object({
  routeId: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  source: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  reason: z.enum(["auth-required", "session-expired", "force-relogin"]).optional(),
  forceReauth: z.boolean().optional(),
});

export const authRiskContextSchema = z
  .object({
    deviceId: z.string().min(1).optional(),
    userAgent: z.string().min(1).optional(),
    ipRegion: z.string().min(1).optional(),
    frequencyKey: z.string().min(1).optional(),
    scene: z.string().min(1).optional(),
  })
  .optional();

export const loginRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  credential: z.object({
    method: z.enum(["wechat_code", "phone_code", "password", "guest", "oauth"]).optional(),
    code: z.string().min(1).optional(),
    authCode: z.string().min(1).optional(),
    anonymousId: z.string().min(1).optional(),
    phoneNumber: z.string().min(1).optional(),
    verificationCode: z.string().min(1).optional(),
    account: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    providerToken: z.string().min(1).optional(),
    providerUserId: z.string().min(1).optional(),
    oauthState: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
  }),
  riskContext: authRiskContextSchema,
  redirectTarget: authRedirectTargetSchema.optional(),
});

export const refreshTokenRequestSchema = z.object({
  platform: z.enum(["wechat", "h5"]),
  refreshToken: z.string().min(1),
});

export const phoneVerificationRequestSchema = z.object({
  phoneNumber: z.string().min(1),
  purpose: z.enum([
    "login",
    "guest_upgrade",
    "phone_binding",
    "change_phone",
    "password_reset",
    "account_security",
  ]),
  deviceId: z.string().min(1).optional(),
  riskContext: authRiskContextSchema,
});

export const passwordCredentialSchema = z.object({
  account: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  password: z.string().min(8),
  verificationCode: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
});

export const oauthAuthorizeSchema = z.object({
  provider: z.string().min(1),
  purpose: z.enum(["login", "bind"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
  deviceId: z.string().min(1).optional(),
});

export const oauthCallbackSchema = z.object({
  provider: z.string().min(1),
  state: z.string().min(1),
  providerToken: z.string().min(8),
  providerUserId: z.string().min(1),
  platform: z.enum(["wechat", "h5"]),
  redirectTarget: authRedirectTargetSchema.optional(),
});

export const identityBindOAuthSchema = z.object({
  provider: z.string().min(1),
  state: z.string().min(1),
  providerToken: z.string().min(8),
  providerUserId: z.string().min(1),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

export const identityUpgradeSchema = z.object({
  credential: z.object({
    method: z.enum(["phone_code", "password"]),
    phoneNumber: z.string().min(1).optional(),
    verificationCode: z.string().min(1).optional(),
    account: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    deviceId: z.string().min(1).optional(),
  }),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

export const identityBindPhoneSchema = z.object({
  phoneNumber: z.string().min(1),
  verificationCode: z.string().min(1),
  mergeStrategy: z.enum(["prompt", "merge"]).optional(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

export const identityMergeSchema = z.object({
  targetUserId: z.string().min(1),
  workflowKind: z.enum(["guest_upgrade", "phone_binding", "oauth_binding"]).optional(),
  confirm: z.boolean(),
  redirectTarget: authRedirectTargetSchema.optional(),
});

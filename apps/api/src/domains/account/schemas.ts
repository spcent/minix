import { z } from "zod";

export const updateAccountProfileSchema = z.object({
  nickname: z.string().min(1).max(32).optional(),
  region: z.string().min(1).max(64).optional(),
  bio: z.string().min(1).max(160).optional(),
  avatarAssetId: z.string().min(1).optional(),
});

export const changeAccountPhoneSchema = z.object({
  phoneNumber: z.string().min(1),
  verificationCode: z.string().min(1),
  securityVerificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
});

export const accountUnbindSchema = z.object({
  provider: z.string().min(1),
  providerUserId: z.string().min(1).optional(),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
});

export const accountProviderRevokeSchema = z.object({
  provider: z.string().min(1),
  providerUserId: z.string().min(1),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
  reason: z.string().min(1).max(120).optional(),
});

export const accountCancellationSchema = z.object({
  action: z.enum(["request", "revoke"]).optional(),
  verificationCode: z.string().min(1).optional(),
  riskConfirmed: z.boolean().optional(),
  reason: z.enum(["privacy", "switching", "other"]).optional(),
  details: z.string().min(1).max(240).optional(),
});

export const relationActionSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(["follow", "unfollow", "block", "unblock", "set_remark", "clear_remark"]),
  remarkName: z.string().min(1).max(32).optional(),
  listKind: z.enum(["following", "followers", "friends", "blocked", "remarks"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
  keyword: z.string().min(1).max(50).optional(),
});

export const relationListQuerySchema = z.object({
  kind: z.enum(["following", "followers", "friends", "blocked", "remarks"]),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
  keyword: z.string().min(1).max(50).optional(),
});

export const assetHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  subject: z.enum(["all", "points", "level", "membership", "entitlement", "balance"]).optional(),
});

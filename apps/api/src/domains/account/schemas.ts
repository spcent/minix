import { USER_ASSET_LEDGER_SUBJECTS, USER_RELATION_ACTION_KINDS, USER_RELATION_LIST_KINDS } from "@minix/contracts";
import { z } from "zod";

import { apiPageSizeMax100QuerySchema, apiPageSizeMax50QuerySchema, apiPaginationQueryShape } from "../schema-helpers";

const USER_ASSET_LEDGER_SUBJECT_FILTERS = ["all", ...USER_ASSET_LEDGER_SUBJECTS] as const;

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
  action: z.enum(USER_RELATION_ACTION_KINDS),
  remarkName: z.string().min(1).max(32).optional(),
  listKind: z.enum(USER_RELATION_LIST_KINDS).optional(),
  page: apiPaginationQueryShape.page,
  pageSize: apiPageSizeMax50QuerySchema,
  keyword: z.string().min(1).max(50).optional(),
});

export const relationListQuerySchema = z.object({
  kind: z.enum(USER_RELATION_LIST_KINDS),
  page: apiPaginationQueryShape.page,
  pageSize: apiPageSizeMax50QuerySchema,
  keyword: z.string().min(1).max(50).optional(),
});

export const assetHistoryQuerySchema = z.object({
  page: apiPaginationQueryShape.page,
  pageSize: apiPageSizeMax100QuerySchema,
  subject: z.enum(USER_ASSET_LEDGER_SUBJECT_FILTERS).optional(),
});

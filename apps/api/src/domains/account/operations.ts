import type {
  AccountOperation,
  AccountOperationCooldown,
  AccountOperationKind,
  AccountOperationRecord,
  AuthDeviceIdentity,
  AuthProviderIdentity,
  AuthRateLimitState,
  AuthSecurityAuditEvent,
  AuthSecurityPrompt,
  AuthVerificationPurpose,
  SecurityCenter,
  UserAvailabilityStatus,
} from "@minix/contracts";

import type { SessionRecord, UserState } from "../../types";

export const ACCOUNT_OPERATION_COOLDOWN_MS = 10 * 60 * 1000;
export const ACCOUNT_CANCELLATION_COOLING_OFF_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveMaskedPhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) {
    return undefined;
  }

  const normalized = phoneNumber.replace(/[^\d]/g, "");
  if (normalized.length < 7) {
    return undefined;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

export function resolveUserAvailability(
  session: SessionRecord,
  userState: UserState,
): UserAvailabilityStatus {
  if (session.authStatus === "guest") {
    return "guest";
  }

  return userState.availabilityStatus ?? "enabled";
}

function resolveOperationCooldown(
  userState: UserState,
  kind: AccountOperationKind,
  now = Date.now(),
): AccountOperationCooldown | undefined {
  userState.operationCooldownsByKind ??= {};
  const cooldown = userState.operationCooldownsByKind[kind];
  if (!cooldown) {
    return undefined;
  }

  const expiresAtMs = cooldown.expiresAt ? Date.parse(cooldown.expiresAt) : Number.NaN;
  const secondsRemaining = Number.isFinite(expiresAtMs)
    ? Math.max(0, Math.ceil((expiresAtMs - now) / 1000))
    : 0;
  const active = cooldown.active && secondsRemaining > 0;
  if (!active) {
    delete userState.operationCooldownsByKind[kind];
    return undefined;
  }

  const nextCooldown: AccountOperationCooldown = {
    ...cooldown,
    active,
    secondsRemaining,
  };
  userState.operationCooldownsByKind[kind] = nextCooldown;
  return nextCooldown;
}

export function setAccountOperationCooldown(
  userState: UserState,
  input: {
    kind: AccountOperationKind;
    label: string;
    durationMs: number;
    now?: number;
  },
): AccountOperationCooldown {
  const now = input.now ?? Date.now();
  const cooldown: AccountOperationCooldown = {
    active: true,
    label: input.label,
    secondsRemaining: Math.max(0, Math.ceil(input.durationMs / 1000)),
    expiresAt: new Date(now + input.durationMs).toISOString(),
  };
  userState.operationCooldownsByKind[input.kind] = cooldown;
  return cooldown;
}

export function clearAccountOperationCooldown(
  userState: UserState,
  kind: AccountOperationKind,
): void {
  delete userState.operationCooldownsByKind[kind];
}

export function resolveAccountSecurityPhoneNumber(
  session: SessionRecord,
  userState: UserState,
): string | undefined {
  if (userState.boundPhoneNumber) {
    return userState.boundPhoneNumber;
  }

  return session.identity.phoneBound ? "13800000001" : undefined;
}

export function createSecurityCenter(userState: UserState): SecurityCenter {
  const security = userState.authSecurity;
  const deviceIdentities: AuthDeviceIdentity[] = security
    ? Object.values(security.devicesById ?? {})
        .slice()
        .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
        .map((device) => ({ ...device }))
    : [];
  const auditEvents: AuthSecurityAuditEvent[] = security?.auditEvents
    ? security.auditEvents.map((event) => ({ ...event }))
    : [];
  const latestRateLimit: AuthRateLimitState | undefined = security?.rateLimitStatesByScope
    ? Object.values(security.rateLimitStatesByScope)
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    : undefined;
  const latestPrompt: AuthSecurityPrompt | undefined = security?.latestPrompt
    ? { ...security.latestPrompt }
    : undefined;
  const trustedDevices = deviceIdentities.filter((device) => device.trusted).length;
  const provisionalDevices = deviceIdentities.filter((device) => device.trustLabel === "provisional").length;
  const reviewRequiredDevices = deviceIdentities.filter((device) => !device.trusted).length;
  const latestSeenAt = deviceIdentities[0]?.lastSeenAt;

  return {
    deviceIdentities,
    auditEvents,
    ...(latestRateLimit ? { latestRateLimit: { ...latestRateLimit } } : {}),
    ...(latestPrompt ? { latestPrompt } : {}),
    ...(deviceIdentities.length > 0
      ? {
          deviceSummary: {
            totalDevices: deviceIdentities.length,
            trustedDevices,
            provisionalDevices,
            reviewRequiredDevices,
            ...(latestSeenAt ? { latestSeenAt } : {}),
          },
        }
      : {}),
  };
}

function resolveProviderLabel(provider: string): string {
  const normalized = provider.trim();
  if (normalized.length === 0) {
    return "Provider";
  }

  if (normalized === "wechat-open-platform") {
    return "WeChat Open Platform";
  }

  return normalized
    .split(/[-_]+/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function createProviderSubject(provider: string, providerUserId: string): string {
  return `${provider.toLowerCase()}:${providerUserId}`;
}

function getProviderCredentialsForUser(userState: UserState, userId: string) {
  return Object.values(userState.authSecurity?.oauthCredentialsByProviderSubject ?? {}).filter(
    (record) => record.userId === userId,
  );
}

export function hasFallbackCredential(
  session: SessionRecord,
  userState: UserState,
  input?: {
    excludingProvider?: {
      provider: string;
      providerUserId: string;
    };
  },
): boolean {
  const passwordCredentialCount = Object.keys(
    userState.authSecurity?.passwordCredentialsBySubject ?? {},
  ).length;
  const activeProviderCount = getProviderCredentialsForUser(userState, session.userId).filter(
    (record) => {
      if ((record.authorizationStatus ?? "active") !== "active") {
        return false;
      }
      if (!input?.excludingProvider) {
        return true;
      }
      return (
        createProviderSubject(record.provider, record.providerUserId) !==
        createProviderSubject(
          input.excludingProvider.provider,
          input.excludingProvider.providerUserId,
        )
      );
    },
  ).length;
  return (
    Boolean(resolveAccountSecurityPhoneNumber(session, userState)) ||
    passwordCredentialCount > 0 ||
    activeProviderCount > 0
  );
}

export function createProviderIdentities(
  session: SessionRecord,
  userState: UserState,
): AuthProviderIdentity[] {
  const linkedProviders = getProviderCredentialsForUser(userState, session.userId)
    .slice()
    .sort(
      (left, right) =>
        (right.lastAuthorizedAt ?? right.linkedAt ?? right.createdAt ?? 0) -
        (left.lastAuthorizedAt ?? left.linkedAt ?? left.createdAt ?? 0),
    );

  return linkedProviders.map((record) => {
    const active = (record.authorizationStatus ?? "active") === "active";
    const canUnlink = hasFallbackCredential(session, userState, {
      excludingProvider: {
        provider: record.provider,
        providerUserId: record.providerUserId,
      },
    });
    const providerSafetyBlockedReason =
      "Another usable login method must remain available before removing this provider.";
    return {
      provider: record.provider,
      providerLabel: resolveProviderLabel(record.provider),
      providerUserId: record.providerUserId,
      authorizationStatus: record.authorizationStatus ?? "active",
      loginEnabled: active,
      linkedAt: new Date(record.linkedAt ?? record.createdAt).toISOString(),
      ...(record.lastAuthorizedAt
        ? { lastAuthorizedAt: new Date(record.lastAuthorizedAt).toISOString() }
        : {}),
      ...(record.revokedAt ? { revokedAt: new Date(record.revokedAt).toISOString() } : {}),
      ...(record.revocationReason ? { revocationReason: record.revocationReason } : {}),
      actions: [
        {
          kind: "unlink",
          label: "Unlink provider",
          available: canUnlink,
          destructive: true,
          ...(canUnlink ? {} : { blockedReason: providerSafetyBlockedReason }),
        },
        {
          kind: active ? "revoke" : "reauthorize",
          label: active ? "Revoke authorization" : "Reauthorize provider",
          available: active ? canUnlink : true,
          destructive: active,
          ...(active && !canUnlink ? { blockedReason: providerSafetyBlockedReason } : {}),
        },
      ],
    };
  });
}

export function appendAccountOperationRecord(
  userState: UserState,
  input: {
    kind: AccountOperationKind;
    status: AccountOperationRecord["status"];
    actorLabel: string;
    message: string;
    createdAt?: string;
    verificationPurpose?: AuthVerificationPurpose;
    notificationHookLabel?: string;
  },
): AccountOperationRecord {
  const record: AccountOperationRecord = {
    recordId: `account_op_${crypto.randomUUID()}`,
    kind: input.kind,
    status: input.status,
    actorLabel: input.actorLabel,
    createdAt: input.createdAt ?? new Date().toISOString(),
    message: input.message,
    ...(input.verificationPurpose
      ? { verificationPurpose: input.verificationPurpose }
      : {}),
    ...(input.notificationHookLabel
      ? { notificationHookLabel: input.notificationHookLabel }
      : {}),
  };
  userState.operationRecords = [record, ...userState.operationRecords].slice(0, 20);
  return record;
}

export function createAccountOperations(
  session: SessionRecord,
  userState: UserState,
  availability: UserAvailabilityStatus,
): AccountOperation[] {
  const phoneBound = Boolean(resolveAccountSecurityPhoneNumber(session, userState));
  const wechatBound = Boolean(userState.wechatBoundOverride ?? session.identity.wechatBound);
  const fallbackCredentialAvailable = hasFallbackCredential(session, userState);
  const changePhoneCooldown = resolveOperationCooldown(userState, "change_phone");
  const unbindCooldown = resolveOperationCooldown(userState, "unbind_wechat");
  const cancellationCooldown =
    resolveOperationCooldown(userState, "request_cancellation") ??
    (userState.pendingCancellation
      ? setAccountOperationCooldown(userState, {
          kind: "request_cancellation",
          label:
            "Cancellation is in the cooling-off window and can still be revoked.",
          durationMs: Math.max(
            0,
            Date.parse(userState.pendingCancellation.effectiveAt) - Date.now(),
          ),
          now: Date.now(),
        })
      : undefined);
  const restrictedReason =
    availability === "frozen"
      ? "This account is frozen and cannot change account settings right now."
      : availability === "blacklisted"
        ? "This account is blacklisted and account operations are locked."
        : availability === "cancellation_pending"
          ? "Cancellation is already pending for this account."
          : undefined;

  return [
    {
      kind: "edit_profile",
      label: "Edit profile",
      available: availability === "enabled",
      statusLabel:
        availability === "enabled"
          ? "You can update nickname, region, and bio."
          : restrictedReason ?? "Unavailable",
      ...(availability === "enabled"
        ? {}
        : { blockedReason: restrictedReason ?? "Unavailable" }),
    },
    {
      kind: "change_phone",
      label: phoneBound ? "Change phone" : "Bind phone",
      available: availability === "enabled" && !changePhoneCooldown,
      statusLabel:
        availability === "enabled"
          ? changePhoneCooldown
            ? changePhoneCooldown.label
            : phoneBound
              ? "A verified phone can be replaced."
              : "No verified phone is currently bound."
          : restrictedReason ?? "Unavailable",
      verificationRequired: phoneBound,
      reversible: true,
      riskPrompt: {
        title: phoneBound ? "Replacing the verified phone changes account recovery" : "Binding a phone adds a recovery credential",
        message:
          "Verify the request to make sure the account keeps a working recovery method.",
        severity: "warning",
        acknowledgeLabel: phoneBound ? "Change phone" : "Bind phone",
      },
      ...(changePhoneCooldown ? { cooldown: changePhoneCooldown } : {}),
      ...(availability === "enabled" && !changePhoneCooldown
        ? {}
        : {
            blockedReason:
              restrictedReason ?? changePhoneCooldown?.label ?? "Unavailable",
          }),
    },
    {
      kind: "unbind_wechat",
      label: "Unbind WeChat",
      available:
        availability === "enabled" &&
        wechatBound &&
        phoneBound &&
        fallbackCredentialAvailable &&
        !unbindCooldown,
      statusLabel:
        availability === "enabled"
          ? !wechatBound
            ? "No WeChat binding is active."
            : !phoneBound
              ? "A verified phone security check is required before unbinding WeChat."
              : fallbackCredentialAvailable
                ? unbindCooldown?.label ??
                  "WeChat can be removed because another recovery credential is available."
                : "Another recovery credential must remain available before unbinding WeChat."
          : restrictedReason ?? "Unavailable",
      verificationRequired: true,
      destructive: true,
      reversible: true,
      riskPrompt: {
        title: "Unbinding WeChat removes a primary sign-in method",
        message:
          "Confirm that a fallback credential remains available before removing this binding.",
        severity: "warning",
        acknowledgeLabel: "Unbind WeChat",
      },
      ...(unbindCooldown ? { cooldown: unbindCooldown } : {}),
      ...(availability === "enabled" &&
      wechatBound &&
      phoneBound &&
      fallbackCredentialAvailable &&
      !unbindCooldown
        ? {}
        : {
            blockedReason:
              restrictedReason ??
              unbindCooldown?.label ??
              (!wechatBound
                ? "No WeChat binding is active."
                : !phoneBound
                  ? "A verified phone security check is required before unbinding WeChat."
                  : "Another recovery credential must remain available before unbinding WeChat."),
          }),
    },
    {
      kind: "request_cancellation",
      label: "Request cancellation",
      available: availability === "enabled" && phoneBound,
      statusLabel:
        availability === "cancellation_pending"
          ? "Cancellation has already been requested."
          : availability === "enabled"
            ? phoneBound
              ? "Submit a cancellation request for the current account."
              : "A verified phone security check is required before requesting cancellation."
            : restrictedReason ?? "Unavailable",
      verificationRequired: true,
      destructive: true,
      reversible: true,
      riskPrompt: {
        title: "Cancellation schedules irreversible account closure",
        message:
          "The request enters a cooling-off period first. During that window you can still revoke it.",
        severity: "critical",
        acknowledgeLabel: "Request cancellation",
      },
      ...(cancellationCooldown ? { cooldown: cancellationCooldown } : {}),
      ...(availability === "enabled" && phoneBound
        ? {}
        : {
            blockedReason:
              restrictedReason ??
              (phoneBound
                ? cancellationCooldown?.label ?? "Unavailable"
                : "A verified phone security check is required before requesting cancellation."),
          }),
    },
    {
      kind: "revoke_cancellation",
      label: "Revoke cancellation",
      available:
        availability === "cancellation_pending" &&
        Boolean(userState.pendingCancellation) &&
        Boolean(cancellationCooldown?.active),
      statusLabel:
        availability === "cancellation_pending" && userState.pendingCancellation
          ? `Revocable until ${userState.pendingCancellation.revokeUntil}.`
          : "No cancellation request is pending.",
      ...(cancellationCooldown ? { cooldown: cancellationCooldown } : {}),
      ...(availability === "cancellation_pending" &&
      userState.pendingCancellation &&
      cancellationCooldown?.active
        ? {}
        : {
            blockedReason:
              availability === "cancellation_pending"
                ? "The cancellation request can no longer be revoked."
                : "No cancellation request is pending.",
          }),
    },
  ];
}

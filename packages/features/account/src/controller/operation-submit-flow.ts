import type {
  AccountCancellationRequest,
  ChangeBoundPhoneRequest,
  UpdateUserProfileRequest,
} from "@minix/contracts";

import type { AccountOperationFormValues } from "../model";

export type AccountOperationSubmitAction =
  | {
      kind: "edit_profile";
      request: UpdateUserProfileRequest;
    }
  | {
      kind: "change_phone";
      request: ChangeBoundPhoneRequest;
    }
  | {
      kind: "request_cancellation";
      request: AccountCancellationRequest;
    }
  | {
      kind: "noop";
    };

export function createAccountOperationSubmitAction(
  values: AccountOperationFormValues,
): AccountOperationSubmitAction {
  if (values.operationKind === "edit_profile") {
    return {
      kind: "edit_profile",
      request: {
        nickname: values.nickname,
        region: values.region,
        ...(values.includeBio ? { bio: values.bio } : { bio: "" }),
      },
    };
  }

  if (values.operationKind === "change_phone") {
    return {
      kind: "change_phone",
      request: {
        phoneNumber: values.phoneNumber,
        verificationCode: values.verificationCode,
        securityVerificationCode: values.securityVerificationCode,
        riskConfirmed: values.riskConfirmed,
      },
    };
  }

  if (values.operationKind === "request_cancellation") {
    return {
      kind: "request_cancellation",
      request: {
        action: "request",
        confirm: true,
        verificationCode: values.verificationCode,
        riskConfirmed: values.riskConfirmed,
        ...(values.cancellationReason ? { reason: values.cancellationReason } : {}),
        ...(values.cancellationDetails ? { details: values.cancellationDetails } : {}),
      },
    };
  }

  return { kind: "noop" };
}

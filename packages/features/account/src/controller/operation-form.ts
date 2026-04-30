import { createFormWorkflowState } from "@minix/core";
import type {
  AccountOperation,
  CurrentUserResponse,
  FormApprovalNode,
  FormFieldDefinition,
  FormSchema,
  FormValidationError,
} from "@minix/contracts";

import {
  createDefaultAccountOperationValues,
  type AccountOperationFormValues,
  type AccountState,
} from "../model";

export const accountFormDraftStorageKey = "@minix/account/operation-form-draft/v1";

export function createAccountDraftState(input: {
  savedAt: number;
  currentStepKey?: string;
  restored?: boolean;
}): AccountState["workflow"]["draft"] {
  return {
    draftId: "account-operation",
    recoveryKey: accountFormDraftStorageKey,
    lastSavedAt: input.savedAt,
    ...(input.restored ? { restoredAt: Date.now() } : {}),
  };
}

export function createAccountOperationValuesFromProfile(
  profile: Pick<CurrentUserResponse, "userProfile"> | undefined,
  values: Partial<AccountOperationFormValues> = {},
): AccountOperationFormValues {
  return createDefaultAccountOperationValues({
    nickname: profile?.userProfile.nickname ?? "",
    region: profile?.userProfile.region ?? "",
    includeBio: Boolean(profile?.userProfile.bio),
    bio: profile?.userProfile.bio ?? "",
    ...values,
  });
}

export function createAccountWorkflow(
  values: AccountOperationFormValues,
  currentStepKey?: string,
  operation?: AccountOperation,
  draft?: AccountState["workflow"]["draft"],
) {
  const schema = createAccountFormSchema(values, operation);
  const approvalNodes = createAccountApprovalNodes(values, operation);
  const workflowOptions: Parameters<typeof createFormWorkflowState<AccountOperationFormValues>>[0] = {
    values,
    schema,
    approvalState: values.operationKind === "request_cancellation" ? "pending" : "none",
    ...(currentStepKey ? { currentStepKey } : {}),
    ...(approvalNodes.length > 0 ? { approvalNodes } : {}),
    ...(draft ? { draft } : {}),
  };

  return createFormWorkflowState(workflowOptions);
}

export function createAccountFormSchema(values: AccountOperationFormValues, operation?: AccountOperation): FormSchema {
  const fields: FormFieldDefinition[] = [];

  if (values.operationKind === "edit_profile") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "profile" },
      { key: "nickname", label: "Nickname", type: "text", required: true, stepKey: "profile" },
      { key: "region", label: "Region", type: "text", stepKey: "profile" },
      { key: "includeBio", label: "Add bio", type: "single_select", dynamic: true, stepKey: "preferences" },
      {
        key: "bio",
        label: "Bio",
        type: "text",
        dynamic: true,
        stepKey: "preferences",
        conditions: [{ field: "includeBio", operator: "truthy" }],
      },
    );
    return {
      fields,
      steps: [
        { key: "profile", label: "Profile" },
        { key: "preferences", label: "Preferences" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  if (values.operationKind === "change_phone") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "contact" },
      { key: "phoneNumber", label: "Phone number", type: "text", required: true, stepKey: "contact" },
      { key: "verificationCode", label: "Verification code", type: "text", required: true, stepKey: "verify" },
    );
    if (operation?.verificationRequired) {
      fields.push({
        key: "securityVerificationCode",
        label: "Security verification code",
        type: "text",
        required: true,
        dynamic: true,
        stepKey: "verify",
      });
    }
    if (operation?.riskPrompt) {
      fields.push({
        key: "riskConfirmed",
        label: "Risk confirmation",
        type: "single_select",
        dynamic: true,
        stepKey: "confirm",
      });
    }
    return {
      fields,
      steps: [
        { key: "contact", label: "Contact" },
        { key: "verify", label: "Verify" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  if (values.operationKind === "request_cancellation") {
    fields.push(
      { key: "operationKind", label: "Operation", type: "single_select", dynamic: true, stepKey: "review" },
      { key: "verificationCode", label: "Security verification code", type: "text", required: true, stepKey: "review" },
      { key: "riskConfirmed", label: "Risk confirmation", type: "single_select", dynamic: true, stepKey: "review" },
      { key: "cancellationReason", label: "Cancellation reason", type: "single_select", required: true, dynamic: true, stepKey: "reason" },
      {
        key: "cancellationDetails",
        label: "Cancellation details",
        type: "text",
        dynamic: true,
        stepKey: "reason",
        conditions: [{ field: "cancellationReason", operator: "eq", value: "other" }],
      },
      { key: "confirmCancellation", label: "Confirm cancellation", type: "single_select", dynamic: true, stepKey: "confirm" },
    );
    return {
      fields,
      steps: [
        { key: "review", label: "Review" },
        { key: "reason", label: "Reason" },
        { key: "confirm", label: "Confirm" },
      ],
    };
  }

  return {
    fields,
    steps: [],
  };
}

export function createAccountApprovalNodes(values: AccountOperationFormValues, operation?: AccountOperation): FormApprovalNode[] {
  if (values.operationKind !== "request_cancellation") {
    return [];
  }

  return [
    {
      nodeKey: "risk_review",
      label: "Risk review",
      state: operation?.riskPrompt ? "pending" : "not_started",
      assigneeLabel: "Risk Ops",
      comment: operation?.riskPrompt?.message ?? "Cancellation requests are reviewed before the cooling-off window starts.",
    },
    {
      nodeKey: "cooling_off",
      label: "Cooling-off window",
      state: operation?.cooldown?.active ? "pending" : "not_started",
      assigneeLabel: "Account system",
    },
  ];
}

export function validateOperationValues(
  values: AccountOperationFormValues,
  operation?: AccountOperation,
): FormValidationError[] {
  const errors: FormValidationError[] = [];

  if (!values.operationKind) {
    errors.push({
      field: "operationKind",
      message: "Choose an account operation before submitting.",
      rule: "required",
      fieldType: "single_select",
      blocking: true,
    });
    return errors;
  }

  if (values.operationKind === "edit_profile") {
    if (!values.nickname.trim()) {
      errors.push({
        field: "nickname",
        message: "Enter a nickname before updating the profile.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }

    if (values.includeBio && !values.bio.trim()) {
      errors.push({
        field: "bio",
        message: "Add a bio or turn off the optional bio field.",
        rule: "cross_field",
        fieldType: "text",
        blocking: true,
      });
    }
  }

  if (values.operationKind === "change_phone") {
    if (!values.phoneNumber.trim()) {
      errors.push({
        field: "phoneNumber",
        message: "Enter the replacement phone number.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (!values.verificationCode.trim()) {
      errors.push({
        field: "verificationCode",
        message: "Enter the verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.verificationRequired && !values.securityVerificationCode.trim()) {
      errors.push({
        field: "securityVerificationCode",
        message: "Enter the current phone security verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.riskPrompt && !values.riskConfirmed) {
      errors.push({
        field: "riskConfirmed",
        message: "Acknowledge the recovery impact before changing the bound phone.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
  }

  if (values.operationKind === "request_cancellation") {
    if (operation?.verificationRequired && !values.verificationCode.trim()) {
      errors.push({
        field: "verificationCode",
        message: "Enter the security verification code.",
        rule: "required",
        fieldType: "text",
        blocking: true,
      });
    }
    if (operation?.riskPrompt && !values.riskConfirmed) {
      errors.push({
        field: "riskConfirmed",
        message: "Acknowledge the cancellation risk before continuing.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
    if (!values.cancellationReason) {
      errors.push({
        field: "cancellationReason",
        message: "Choose a cancellation reason.",
        rule: "required",
        fieldType: "single_select",
        blocking: true,
      });
    }
    if (values.cancellationReason === "other" && !values.cancellationDetails.trim()) {
      errors.push({
        field: "cancellationDetails",
        message: "Describe the cancellation reason before continuing.",
        rule: "cross_field",
        fieldType: "text",
        blocking: true,
      });
    }
    if (!values.confirmCancellation) {
      errors.push({
        field: "confirmCancellation",
        message: "Confirm the cancellation request before submitting.",
        rule: "cross_field",
        fieldType: "single_select",
        blocking: true,
      });
    }
  }

  return errors;
}

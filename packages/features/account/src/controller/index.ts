import {
  cloneFormPageState,
  createControllerRouterHelpers,
  cloneStateSnapshot,
  createStore,
  ok,
  runFormDraftFlow,
  runFormSubmitFlow,
  type AppKernel,
  type Result,
} from "@minix/core";
import type {
  AccountCancellationRequest,
  AccountOperation,
  AccountOperationResponse,
  AccountProviderRevokeRequest,
  AccountUnbindRequest,
  AppRouteId,
  ChangeBoundPhoneRequest,
  CurrentUserResponse,
  IdentityBindPhoneRequest,
  IdentityMergeRequest,
  IdentityTransitionResponse,
  IdentityUpgradeRequest,
  ListUserAssetHistoryRequest,
  ListUserRelationsRequest,
  UpdateUserProfileRequest,
  UserAssetHistoryResponse,
  UserRelationMutationRequest,
  UserRelationListResponse,
  UserRelationMutationResponse,
} from "@minix/contracts";

import {
  createDefaultAccountState,
  type AccountDraftSnapshot,
  type AccountOperationFormValues,
  type AccountState,
} from "../model";
import {
  createAssetHistoryRequestPath,
  createAssetHistoryStatePatch,
} from "./asset-history";
import { findAvailableOperation } from "./account-actions";
import {
  accountFormDraftStorageKey,
  createAccountDraftState,
  createAccountOperationValuesFromProfile,
  createAccountWorkflow,
  validateOperationValues,
} from "./operation-form";
import { createAccountOperationSubmitAction } from "./operation-submit-flow";
import { persistIdentityTransitionResponse } from "./identity-actions";
import {
  createRelationListRequestPath,
  createRelationListSection,
  findAvailableRelationAction,
} from "./relation-actions";
import { resolveProviderActionBlockedMessage } from "./provider-actions";
import { mergeRemoteProfile } from "./profile-projection";
import { upsertSection } from "./section-utils";
import { buildStateFromSession, hasActiveSession } from "./session";

export interface CreateAccountControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<AccountState>;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  overviewRouteId?: AppRouteId;
  identityUpgradeRouteId?: AppRouteId;
  identityBindPhoneRouteId?: AppRouteId;
  identityMergeRouteId?: AppRouteId;
  requestPath?: string;
  authRedirectSource?: string;
}

function cloneState(state: AccountState): AccountState {
  return cloneFormPageState(state) as AccountState;
}

export function createAccountController(options: CreateAccountControllerOptions) {
  const {
    kernel,
    loginRouteId,
    settingsRouteId,
    overviewRouteId,
    identityUpgradeRouteId,
    identityBindPhoneRouteId,
    identityMergeRouteId,
    requestPath = "/me",
    authRedirectSource = "account",
    initialState,
  } = options;
  const store = createStore<AccountState>({
    ...cloneState(createDefaultAccountState()),
    ...initialState,
  });
  const { routeToLogin, routeToOptional } = createControllerRouterHelpers({
    kernel,
    loginRouteId,
    authRedirectSource,
  });

  function applyOperationValues(
    values: AccountOperationFormValues,
    options: {
      dirty?: boolean;
      operationFormOpen?: boolean;
      currentStepKey?: string;
      draft?: AccountState["workflow"]["draft"];
      draftSavedAt?: number;
      phase?: AccountState["submitState"]["phase"];
      preserveResult?: boolean;
    } = {},
  ) {
    const current = store.getState();
    const operation = current.accountOperations?.find((item) => item.kind === values.operationKind);
    const workflow = createAccountWorkflow(
      values,
      options.currentStepKey ?? current.workflow.currentStepKey,
      operation,
      options.draft,
    );
    store.setState({
      dirty: options.dirty ?? current.dirty,
      operationFormOpen: options.operationFormOpen ?? current.operationFormOpen,
      values,
      formValues: cloneStateSnapshot(values),
      workflow,
      fieldErrors: [],
      validationErrors: [],
      submitState: {
        ...current.submitState,
        phase: options.phase ?? current.submitState.phase,
        ...(options.draftSavedAt !== undefined ? { draftSavedAt: options.draftSavedAt } : {}),
        ...(!options.preserveResult ? { result: undefined } : {}),
      },
    });
  }

  async function loadOperationDraft(profile: CurrentUserResponse | undefined) {
    if (!kernel.storage) {
      const values = createAccountOperationValuesFromProfile(profile);
      applyOperationValues(values, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: cloneStateSnapshot(values),
        initialFormValues: cloneStateSnapshot(values),
      });
      return;
    }

    const result = await kernel.storage.get<AccountDraftSnapshot>(accountFormDraftStorageKey);
    if (!result.ok || !result.value) {
      const values = createAccountOperationValuesFromProfile(profile);
      applyOperationValues(values, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: cloneStateSnapshot(values),
        initialFormValues: cloneStateSnapshot(values),
      });
      return;
    }

    const values = createAccountOperationValuesFromProfile(profile, result.value.values);
    applyOperationValues(values, {
      dirty: true,
      operationFormOpen: Boolean(values.operationKind),
      ...(result.value.currentStepKey ? { currentStepKey: result.value.currentStepKey } : {}),
      draft: createAccountDraftState({
        savedAt: result.value.savedAt,
        ...(result.value.currentStepKey ? { currentStepKey: result.value.currentStepKey } : {}),
        restored: true,
      }),
      draftSavedAt: result.value.savedAt,
      phase: "idle",
    });
    store.setState({
      initialValues: createAccountOperationValuesFromProfile(profile),
      initialFormValues: createAccountOperationValuesFromProfile(profile),
    });
  }

  async function clearOperationDraft() {
    if (!kernel.storage) {
      return ok(undefined);
    }

    const removeResult = await kernel.storage.remove(accountFormDraftStorageKey);
    if (!removeResult.ok) {
      return removeResult;
    }

    return ok(undefined);
  }

  async function loadAssetHistoryIntoState(
    input: ListUserAssetHistoryRequest,
  ): Promise<Result<UserAssetHistoryResponse>> {
    const result = await kernel.request.get<UserAssetHistoryResponse>(createAssetHistoryRequestPath(input));
    if (!result.ok) {
      return result;
    }

    store.setState(createAssetHistoryStatePatch(store.getState(), result.value));
    return result;
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    async loadInitial() {
      store.setState({
        loading: true,
        errorText: undefined,
        copyFeedback: undefined,
      });

      const sessionResult = await kernel.session.get();
      if (!sessionResult.ok) {
        store.setState({
          loading: false,
          ready: true,
          errorText: sessionResult.error.message,
        });
        return sessionResult;
      }

      const session = sessionResult.value;
      if (!hasActiveSession(session)) {
        store.replaceState({
          ...cloneState(createDefaultAccountState({
            title: store.getState().title,
            ...(store.getState().subtitle ? { subtitle: store.getState().subtitle } : {}),
          })),
          loading: false,
          ready: true,
          authenticated: false,
          errorText: "Sign in is required before account details can load.",
        });
        await routeToLogin();
        return ok(undefined);
      }

      let nextState = buildStateFromSession(store.getState(), session);

      const remoteProfile = await kernel.request.get<CurrentUserResponse>(requestPath);
      if (!remoteProfile.ok) {
        if (remoteProfile.error.code === "UNAUTHORIZED") {
          store.setState({
            loading: false,
            ready: true,
            authenticated: false,
            errorText: "Your account session expired. Sign in again to continue.",
          });
          await routeToLogin();
          return remoteProfile;
        }

        store.replaceState({
          ...nextState,
          loading: false,
          ready: true,
          errorText: remoteProfile.error.message,
        });
        return remoteProfile;
      }

      nextState = mergeRemoteProfile(nextState, remoteProfile.value);
      const profileSeedValues = createAccountOperationValuesFromProfile(remoteProfile.value);
      store.replaceState({
        ...nextState,
        loading: false,
        ready: true,
        errorText: undefined,
        values: profileSeedValues,
        formValues: cloneStateSnapshot(profileSeedValues),
        initialValues: cloneStateSnapshot(profileSeedValues),
        initialFormValues: cloneStateSnapshot(profileSeedValues),
        workflow: createAccountWorkflow(profileSeedValues),
      });
      await loadOperationDraft(remoteProfile.value);
      const assetHistoryResult = await loadAssetHistoryIntoState({ page: 1, pageSize: 5 });
      if (!assetHistoryResult.ok) {
        store.setState({
          transitionFeedback: assetHistoryResult.error.message,
        });
      }
      return ok(undefined);
    },

    async refresh() {
      return this.loadInitial();
    },

    async copyUserId() {
      const current = store.getState();
      if (!current.userId) {
        return ok(undefined);
      }

      if (!kernel.capability) {
        store.setState({
          copyFeedback: "Clipboard is unavailable on this host.",
        });
        return ok(undefined);
      }

      const clipboardStatus = kernel.capability.status("clipboard");
      if (!clipboardStatus.ok || !clipboardStatus.value.available) {
        store.setState({
          copyFeedback: clipboardStatus.ok ? clipboardStatus.value.detail ?? "Clipboard is unavailable on this host." : "Clipboard is unavailable on this host.",
        });
        return ok(undefined);
      }

      const result = await kernel.capability.execute({
        capability: "clipboard",
        action: "writeText",
        payload: { text: current.userId },
      });

      store.setState({
        copyFeedback: result.ok ? "User ID copied for support and recovery." : result.error.message,
      });
      return result as Result<unknown>;
    },

    async goToSettings() {
      return routeToOptional(settingsRouteId);
    },

    async goToOverview() {
      return routeToOptional(overviewRouteId);
    },

    async goToLogin() {
      return routeToLogin();
    },

    async goToIdentityUpgrade() {
      return routeToOptional(identityUpgradeRouteId);
    },

    async goToPhoneBinding() {
      return routeToOptional(identityBindPhoneRouteId);
    },

    async goToIdentityMerge() {
      return routeToOptional(identityMergeRouteId);
    },

    openOperationForm(operationKind: AccountOperation["kind"]) {
      const currentProfile = store.getState().userProfile;
      const nextValues = createAccountOperationValuesFromProfile(
        currentProfile ? { userProfile: currentProfile } : undefined,
        {
          ...store.getState().values,
          operationKind,
        },
      );
      applyOperationValues(nextValues, {
        dirty: false,
        operationFormOpen: true,
        phase: "idle",
      });
      return ok(undefined);
    },

    setOperationStep(stepKey: string) {
      const workflow = store.getState().workflow;
      if (!workflow.stepKeys.includes(stepKey)) {
        return ok(undefined);
      }

      store.setState({
        workflow: {
          ...workflow,
          currentStepKey: stepKey,
        },
      });
      return ok(undefined);
    },

    updateOperationValues(values: Partial<AccountOperationFormValues>) {
      const nextValues = {
        ...store.getState().values,
        ...values,
      };
      applyOperationValues(nextValues, {
        dirty: true,
        operationFormOpen: true,
        phase: store.getState().submitState.phase === "submitted" ? "idle" : store.getState().submitState.phase,
      });
      return ok(undefined);
    },

    validateOperationForm() {
      const current = store.getState();
      const operation = current.accountOperations?.find((item) => item.kind === current.values.operationKind);
      const errors = validateOperationValues(current.values, operation);
      store.setState({
        fieldErrors: errors,
        validationErrors: errors,
        errorText: errors.length > 0 ? "Please complete the required account operation fields." : undefined,
        submitState: {
          ...store.getState().submitState,
          phase: errors.length > 0 ? "failed" : "idle",
        },
      });
      return errors;
    },

    async saveOperationDraft() {
      if (!kernel.storage) {
        store.setState({
          transitionFeedback: "Account operation drafts are unavailable on this host.",
          submitState: {
            ...store.getState().submitState,
            phase: "failed",
          },
        });
        return ok(undefined);
      }

      const snapshot: AccountDraftSnapshot = {
        savedAt: Date.now(),
        values: cloneStateSnapshot(store.getState().values),
        ...(store.getState().workflow.currentStepKey ? { currentStepKey: store.getState().workflow.currentStepKey } : {}),
      };

      return runFormDraftFlow({
        scope: "account-operation",
        submitState: store.getState().submitState,
        snapshot,
        persist: (draftSnapshot) => kernel.storage.set(accountFormDraftStorageKey, draftSnapshot),
        onStarted: (submitState) => {
          store.setState({ submitState });
        },
        onDuplicate: (submitState) => {
          store.setState({
            transitionFeedback: "This draft is already saved.",
            submitState,
          });
        },
        onFailure: (result) => {
          store.setState({
            errorText: result.error.message,
            submitState: {
              ...store.getState().submitState,
              phase: "failed",
            },
          });
        },
        onSuccess: ({ snapshot: draftSnapshot, submitState }) => {
          store.setState({
            dirty: true,
            workflow: createAccountWorkflow(
              store.getState().values,
              store.getState().workflow.currentStepKey,
              store.getState().accountOperations?.find((item) => item.kind === store.getState().values.operationKind),
              createAccountDraftState({
                savedAt: draftSnapshot.savedAt,
                ...(draftSnapshot.currentStepKey ? { currentStepKey: draftSnapshot.currentStepKey } : {}),
              }),
            ),
            submitState,
            transitionFeedback: "Account operation draft saved.",
          });
        },
      });
    },

    async discardOperationDraft() {
      await clearOperationDraft();
      const currentProfile = store.getState().userProfile;
      const nextValues = createAccountOperationValuesFromProfile(
        currentProfile ? { userProfile: currentProfile } : undefined,
      );
      applyOperationValues(nextValues, {
        dirty: false,
        operationFormOpen: false,
        phase: "idle",
      });
      store.setState({
        initialValues: cloneStateSnapshot(nextValues),
        initialFormValues: cloneStateSnapshot(nextValues),
        transitionFeedback: "Account operation draft discarded.",
      });
      return ok(undefined);
    },

    async submitOperationForm() {
      const errors = this.validateOperationForm();
      if (errors.length > 0) {
        return ok(undefined);
      }

      const values = store.getState().values;
      return runFormSubmitFlow({
        scope: "account-operation",
        submitState: store.getState().submitState,
        values,
        submit: async (submitValues) => {
          const action = createAccountOperationSubmitAction(submitValues);
          return action.kind === "edit_profile"
            ? this.updateProfile(action.request)
            : action.kind === "change_phone"
              ? this.changePhone(action.request)
              : action.kind === "request_cancellation"
                ? this.requestCancellation(action.request)
                : ok(undefined);
        },
        onStarted: (submitState) => {
          store.setState({ submitState });
        },
        onDuplicate: (submitState) => {
          store.setState({
            transitionFeedback: "This account operation was already submitted.",
            submitState,
          });
        },
        onFailure: ({ submitState }) => {
          store.setState({ submitState });
        },
        onSuccess: async ({ result, submittedAt, submitState }) => {
          await clearOperationDraft();
          const currentProfile = store.getState().userProfile;
          const resetValues = createAccountOperationValuesFromProfile(
            currentProfile ? { userProfile: currentProfile } : undefined,
          );
          applyOperationValues(resetValues, {
            dirty: false,
            operationFormOpen: false,
            phase: "submitted",
          });
          store.setState({
            initialValues: cloneStateSnapshot(resetValues),
            initialFormValues: cloneStateSnapshot(resetValues),
            lastSubmission: {
              submittedAt,
              value: result,
            },
            submitState,
          });
        },
      });
    },

    async submitGuestUpgrade(input: IdentityUpgradeRequest) {
      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/upgrade", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistIdentityTransitionResponse({ kernel, store, response: result.value });
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },

    async submitPhoneBinding(input: IdentityBindPhoneRequest) {
      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/bind-phone", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistIdentityTransitionResponse({ kernel, store, response: result.value });
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },

    async updateProfile(input: UpdateUserProfileRequest) {
      const available = findAvailableOperation(store.getState().accountOperations, "edit_profile");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/profile", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async changePhone(input: ChangeBoundPhoneRequest) {
      const available = findAvailableOperation(store.getState().accountOperations, "change_phone");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/change-phone", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async unbindWechat(input: AccountUnbindRequest = { provider: "wechat" }) {
      const available = findAvailableOperation(store.getState().accountOperations, "unbind_wechat");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/unbind", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async unlinkProvider(input: AccountUnbindRequest) {
      const message = resolveProviderActionBlockedMessage(store.getState(), input, "unlink");
      if (message) {
        store.setState({
          transitionFeedback: message,
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/provider/unlink", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async revokeProvider(input: AccountProviderRevokeRequest) {
      const message = resolveProviderActionBlockedMessage(store.getState(), input, "revoke");
      if (message) {
        store.setState({
          transitionFeedback: message,
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/provider/revoke", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async requestCancellation(input: AccountCancellationRequest = { action: "request", confirm: true }) {
      const available = findAvailableOperation(store.getState().accountOperations, "request_cancellation");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/cancellation", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async revokeCancellation(input: AccountCancellationRequest = { action: "revoke", confirm: true }) {
      const available = findAvailableOperation(store.getState().accountOperations, "revoke_cancellation");
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const result = await kernel.request.post<AccountOperationResponse>("/account/cancellation", input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      store.setState({
        transitionFeedback: result.value.transitionMessage,
      });
      const refreshed = await this.loadInitial();
      if (refreshed.ok) {
        store.setState({
          transitionFeedback: result.value.transitionMessage,
        });
      }
      return refreshed;
    },

    async loadRelationList(input: ListUserRelationsRequest) {
      const result = await kernel.request.get<UserRelationListResponse>(createRelationListRequestPath(input));
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const relationListSection = createRelationListSection(result.value.relationList);
      store.setState({
        accountSummary: result.value.accountSummary,
        userStatus: result.value.userStatus,
        ...(result.value.accountWorkspaceSummary
          ? { accountWorkspaceSummary: result.value.accountWorkspaceSummary }
          : {}),
        relationList: result.value.relationList,
        activeRelationListKind: result.value.relationList.kind,
        relationKeyword: result.value.relationList.keyword ?? "",
        sections: relationListSection
          ? upsertSection(store.getState().sections, relationListSection)
          : store.getState().sections,
      });
      return result;
    },

    async loadAssetHistory(input: ListUserAssetHistoryRequest) {
      const result = await loadAssetHistoryIntoState(input);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
      }
      return result;
    },

    async applyRelationAction(input: UserRelationMutationRequest) {
      const available = findAvailableRelationAction(store.getState().relationTargets, input.targetUserId, input.action);
      if (!available.ok) {
        store.setState({
          transitionFeedback: available.error.message,
        });
        return available;
      }

      const state = store.getState();
      const result = await kernel.request.post<UserRelationMutationResponse>("/account/relations", {
        ...input,
        ...(state.activeRelationListKind ? { listKind: state.activeRelationListKind } : {}),
        ...(state.relationList?.pagination.page ? { page: state.relationList.pagination.page } : {}),
        ...(state.relationList?.pagination.pageSize ? { pageSize: state.relationList.pagination.pageSize } : {}),
        ...(state.relationKeyword ? { keyword: state.relationKeyword } : {}),
      });
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const relationListSection = createRelationListSection(result.value.relationList);
      store.setState({
        accountSummary: result.value.accountSummary,
        userStatus: result.value.userStatus,
        ...(result.value.accountWorkspaceSummary
          ? { accountWorkspaceSummary: result.value.accountWorkspaceSummary }
          : {}),
        relationTargets: result.value.relationTargets,
        ...(result.value.relationList ? { relationList: result.value.relationList } : {}),
        ...(result.value.relationList ? { activeRelationListKind: result.value.relationList.kind } : {}),
        ...(result.value.relationList
          ? {
              sections: relationListSection
                ? upsertSection(store.getState().sections, relationListSection)
                : store.getState().sections,
            }
          : {}),
        transitionFeedback: result.value.transitionMessage,
      });
      return ok(undefined);
    },

    async confirmIdentityMerge(input?: Partial<IdentityMergeRequest>) {
      const targetUserId = input?.targetUserId ?? store.getState().identityWorkflows?.pendingWorkflow?.targetUserId;
      if (!targetUserId) {
        store.setState({
          transitionFeedback: "A merge target is required before confirming the account merge.",
        });
        return ok(undefined);
      }

      const result = await kernel.request.post<IdentityTransitionResponse>("/auth/identity/merge", {
        targetUserId,
        confirm: true,
        ...(input?.workflowKind ? { workflowKind: input.workflowKind } : {}),
        ...(input?.redirectTarget ? { redirectTarget: input.redirectTarget } : {}),
      } satisfies IdentityMergeRequest);
      if (!result.ok) {
        store.setState({
          transitionFeedback: result.error.message,
        });
        return result;
      }

      const persisted = await persistIdentityTransitionResponse({ kernel, store, response: result.value });
      if (!persisted.ok) {
        store.setState({
          transitionFeedback: persisted.error.message,
        });
        return persisted;
      }

      return this.loadInitial();
    },
  };
}

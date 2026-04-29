import type {
  ContentLifecycleMutationResponse,
  SaveContentDraftResponse,
} from "@minix/contracts";

import type { UserState } from "../../types";

export type ManagedContentEntry = NonNullable<UserState["managedContentById"]>[string];

export interface ManagedContentMutationSuccess<TValue> {
  ok: true;
  value: TValue;
}

export interface ManagedContentMutationFailure {
  ok: false;
  code: "NOT_FOUND" | "FORBIDDEN";
  message: string;
}

export type ManagedContentMutationResult<TValue> = ManagedContentMutationSuccess<TValue> | ManagedContentMutationFailure;

export type ManagedContentResponseMutationResult = ManagedContentMutationResult<
  ContentLifecycleMutationResponse | SaveContentDraftResponse
>;

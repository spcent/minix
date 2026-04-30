import {
  ok,
  persistAuthSessionResponse,
  type AppKernel,
  type Store,
} from "@minix/core";
import type { IdentityTransitionResponse } from "@minix/contracts";

import type { AccountState } from "../model";

export async function persistIdentityTransitionResponse(input: {
  kernel: AppKernel;
  store: Store<AccountState>;
  response: IdentityTransitionResponse;
}) {
  const existing = await input.kernel.session.get();
  if (!existing.ok) {
    return existing;
  }

  const persisted = await persistAuthSessionResponse(
    {
      session: input.kernel.session,
      env: input.kernel.env,
    },
    input.response,
    existing.value,
  );
  if (!persisted.ok) {
    return persisted;
  }

  input.store.setState({
    transitionFeedback: input.response.identityWorkflow.message,
  });
  return ok(persisted.value);
}

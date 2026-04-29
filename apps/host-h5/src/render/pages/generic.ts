import { escapeHtml, isStoreBackedPage } from "@minix/core";

import { renderButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { buildGenericTitle, renderApp } from "../layout/app-shell";
import type { HostH5PageKey, HostH5PageRenderer, PageWithReadyAction } from "../types";

function isPageWithReadyAction(value: unknown): value is PageWithReadyAction {
  return Boolean(value) && typeof (value as PageWithReadyAction).markReady === "function";
}

export function createGenericRenderer(pageKey: HostH5PageKey): HostH5PageRenderer {
  return {
    render({ root, runtime, sync }) {
      const page = (runtime.pages as Record<string, unknown>)[pageKey];
      const state = isStoreBackedPage(page) ? ((page.store.getState() ?? {}) as { ready?: unknown }) : {};
      const title = buildGenericTitle(pageKey);
      const ready = Boolean(state.ready);

      renderApp(
        root,
        title,
        runtime,
        pageKey,
        `
          <section class="me-screen">
            <section class="me-surface me-card">
              <p class="me-eyebrow">MiniX Host</p>
              <h1 class="me-card-title">${escapeHtml(title)}</h1>
              <p class="me-card-subtitle">Placeholder host page scaffolded for ${escapeHtml(title)}.</p>
              <p class="me-message">Ready: ${ready ? "yes" : "no"}</p>
              <div class="me-action-group">
                ${isPageWithReadyAction(page) ? renderButton("ready", "Mark Ready", "primary") : ""}
              </div>
            </section>
          </section>
        `,
      );

      bindRouteButtons(root, runtime, sync);
      bindButton(root, "ready", () => {
        void Promise.resolve(isPageWithReadyAction(page) ? page.markReady() : undefined).then(sync);
      });
    },
  };
}

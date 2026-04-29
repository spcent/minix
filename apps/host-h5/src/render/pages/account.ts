import { escapeHtml } from "@minix/core";
import type { AccountState } from "@minix/feature-account";

import { renderButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

export function renderAccountPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.account.store.getState() as AccountState;

  renderApp(
    root,
    "Account Center",
    runtime,
    "account",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-profile-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Account</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.authStatusLabel ?? "Session")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(state.sessionLabel ?? "Device session context")}</span>
            </div>
          </div>
          <aside class="me-panel me-profile-panel">
            <p class="me-panel-kicker">Identity</p>
            <h2 class="me-panel-title">${escapeHtml(state.nickname ?? "Guest")}</h2>
            <ul class="me-panel-list">
              ${state.sections
                .slice(0, 2)
                .flatMap((section) => section.items.slice(0, 2))
                .map((item) => `<li>${escapeHtml(`${item.label}: ${String(item.value ?? "")}`)}</li>`)
                .join("")}
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns me-profile-workspace">
          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Summary</p>
            <h2 class="me-card-title">Account snapshot</h2>
            <div class="me-inline-metrics">
              ${state.stats
                .map(
                  (stat) => `
                    <div class="me-inline-metric">
                      <p class="me-inline-metric-value">${escapeHtml(stat.value)}</p>
                      <p class="me-inline-metric-label">${escapeHtml(stat.label)}</p>
                    </div>
                  `,
                )
                .join("")}
            </div>
            ${state.copyFeedback ? `<p class="me-message">${escapeHtml(state.copyFeedback)}</p>` : ""}
            ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
            <div class="me-action-group">
              <button id="account-copy" class="me-button me-button-secondary">Copy User ID</button>
              <button id="account-settings" class="me-button me-button-secondary">Open Preferences</button>
              <button id="account-overview" class="me-button me-button-ghost">Open Overview</button>
              ${state.identityWorkflows?.canUpgradeGuest ? renderButton("account-identity-upgrade", "Upgrade Guest", "primary") : ""}
              ${state.identityWorkflows?.canBindPhone ? renderButton("account-bind-phone", "Bind Phone", "primary") : ""}
              ${state.identityWorkflows?.mergePending ? renderButton("account-identity-merge", "Review Merge", "primary") : ""}
            </div>
          </section>

          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Details</p>
            <h2 class="me-card-title">Shared user domain output</h2>
            ${state.sections
              .map(
                (section) => `
                  <section class="me-settings-section">
                    <h3 class="me-settings-title">${escapeHtml(section.title)}</h3>
                    <div>
                      ${section.items
                        .map(
                          (item) => `
                            <div class="me-settings-item">
                              <p class="me-settings-label">${escapeHtml(item.label)}</p>
                              <p class="me-settings-value">${escapeHtml(String(item.value ?? ""))}</p>
                            </div>
                          `,
                        )
                        .join("")}
                    </div>
                  </section>
                `,
              )
              .join("")}
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "account-copy", () => {
    void runtime.pages.account.copyUserId().then(sync);
  });
  bindButton(root, "account-settings", () => {
    void runtime.pages.account.goToSettings().then(sync);
  });
  bindButton(root, "account-overview", () => {
    void runtime.pages.account.goToOverview().then(sync);
  });
  bindButton(root, "account-identity-upgrade", () => {
    void runtime.pages.account.goToIdentityUpgrade().then(sync);
  });
  bindButton(root, "account-bind-phone", () => {
    void runtime.pages.account.goToPhoneBinding().then(sync);
  });
  bindButton(root, "account-identity-merge", () => {
    void runtime.pages.account.goToIdentityMerge().then(sync);
  });
}

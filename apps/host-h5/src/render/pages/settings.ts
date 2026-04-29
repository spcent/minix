import { escapeHtml, type SettingsPageModel } from "@minix/core";

import { renderButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";
import { formatProgressTimestamp } from "../utils";
import { ensureItemsProgress } from "./items-progress";

function renderSettingsSections(sections: SettingsPageModel["sections"]): string {
  return sections
    .map(
      (section) => `
        <section class="me-settings-section">
          ${section.title ? `<h3 class="me-settings-title">${escapeHtml(section.title)}</h3>` : ""}
          <div>
            ${section.items
              .map(
                (item) => `
                  <div class="me-settings-item">
                    <p class="me-settings-label">${escapeHtml(item.label)}</p>
                    ${item.value !== undefined ? `<p class="me-settings-value">${escapeHtml(String(item.value))}</p>` : ""}
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

export function renderSettingsPage({ root, runtime, sync }: HostH5PageRenderContext) {
  ensureItemsProgress(runtime, sync);
  const state = runtime.pages.settings.store.getState();
  const itemsState = runtime.pages.items.store.getState();

  renderApp(
    root,
    "Learning Preferences",
    runtime,
    "settings",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-profile-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Learning Profile</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Review your study goal, pace, and current session status before returning to overview or today's plan.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">A2 to B1</span>
              <span class="me-chip me-chip-accent">${itemsState.activeFilter} filter saved</span>
              <span class="me-chip me-chip-warm">${itemsState.completedItemIds.length} completed tasks</span>
            </div>
          </div>
          <aside class="me-panel me-profile-panel">
            <p class="me-panel-kicker">Session note</p>
            <h2 class="me-panel-title">${escapeHtml(itemsState.featuredReason ?? "This page reflects the same formal study state that powers the task list.")}</h2>
            <ul class="me-panel-list">
              <li>Study goal and pace feel explicit</li>
              <li>Progress is saved on this device and restored when you return</li>
              <li>Sign-out returns Home and closes the protected session</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns me-profile-workspace">
          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Preferences</p>
            <h2 class="me-card-title">Study profile</h2>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${itemsState.completedItemIds.length}</p>
                <p class="me-inline-metric-label">Completed tasks</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(itemsState.lastProgressAt))}</p>
                <p class="me-inline-metric-label">Last progress save</p>
              </div>
            </div>
            <div class="me-settings-group">${renderSettingsSections(state.sections)}</div>
          </section>

          <section class="me-surface me-card me-profile-actions">
            <p class="me-section-kicker">Session control</p>
            <h2 class="me-card-title">Pause learning on this device</h2>
            <p class="me-card-subtitle">
              Sign out to end this session and return to Home without losing the saved study snapshot.
            </p>
            <div class="me-action-group">
              ${renderButton("open-membership", "Open Commerce Center", "secondary")}
              ${renderButton("open-orders", "Open Order Center", "ghost")}
              ${renderButton("clear-learning-progress", "Clear Saved Progress", "ghost")}
              ${renderButton("logout", "Sign Out", "danger")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "open-membership", () => {
    void runtime.pages.settings.goToMembership().then(sync);
  });
  bindButton(root, "open-orders", () => {
    void runtime.pages.settings.goToOrders().then(sync);
  });
  bindButton(root, "clear-learning-progress", () => {
    void runtime.pages.items.clearProgress().then(sync);
  });
  bindButton(root, "logout", () => {
    void runtime.pages.settings.logout().then(sync);
  });
}

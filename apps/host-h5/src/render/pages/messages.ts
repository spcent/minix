import { escapeHtml } from "@minix/core";
import type { MessagesState } from "@minix/feature-messages";

import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

export function renderMessagesPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.messages.store.getState() as MessagesState;
  const selectedThread =
    state.reservedThreads.find((thread) => thread.threadId === state.selectedThreadId) ?? state.reservedThreads[0];

  renderApp(
    root,
    "Inbox",
    runtime,
    "messages",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Inbox</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle ?? "Shared notifications and reserved conversation threads.")}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(`${state.unreadBadge.totalUnread} total unread`)}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(`${state.unreadBadge.notificationUnread} notices`)}</span>
              <span class="me-chip">${escapeHtml(`${state.unreadBadge.threadUnread} threads`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Unread Badge</p>
            <h2 class="me-panel-title">Shared message output</h2>
            <ul class="me-panel-list">
              ${state.unreadBadge.breakdown.map((entry) => `<li>${escapeHtml(`${entry.label}: ${entry.count}`)}</li>`).join("") || "<li>No unread breakdown entries</li>"}
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Filters</p>
            <h2 class="me-card-title">Notice filters and batch actions</h2>
            <div class="me-chip-row">
              ${(state.filters.find((group) => group.key === "type")?.options ?? [])
                .map(
                  (option) => `
                    <button class="me-filter-button ${state.activeType === option.key ? "me-filter-button-active" : ""}" data-message-type="${escapeHtml(option.key)}">
                      ${escapeHtml(`${option.label} (${option.count})`)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            <div class="me-chip-row">
              ${(state.filters.find((group) => group.key === "group")?.options ?? [])
                .map(
                  (option) => `
                    <button class="me-filter-button ${state.activeGroupKey === option.key ? "me-filter-button-active" : ""}" data-message-group="${escapeHtml(option.key)}">
                      ${escapeHtml(option.label)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            <div class="me-action-group">
              <button id="messages-toggle-unread" class="me-button ${state.onlyUnread ? "me-button-primary" : "me-button-secondary"}">
                ${state.onlyUnread ? "Showing unread only" : "Show unread only"}
              </button>
              <button id="messages-mark-selected" class="me-button me-button-secondary">Mark selected read</button>
              <button id="messages-mark-visible" class="me-button me-button-ghost">Mark visible read</button>
              <button id="messages-settings" class="me-button me-button-ghost">Open Preferences</button>
            </div>
            ${state.lastActionMessage ? `<p class="me-message">${escapeHtml(state.lastActionMessage)}</p>` : ""}
            ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Reserved Threads</p>
            <h2 class="me-card-title">Conversation placeholders</h2>
            <div class="me-settings-group">
              ${state.reservedThreads
                .map(
                  (thread) => `
                    <button class="me-filter-button ${selectedThread?.threadId === thread.threadId ? "me-filter-button-active" : ""}" data-message-thread="${thread.threadId}">
                      ${escapeHtml(`${thread.title} (${thread.unreadCount})`)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            ${
              selectedThread
                ? `
                  <section class="me-settings-section">
                    <h3 class="me-settings-title">${escapeHtml(selectedThread.type)}</h3>
                    <div class="me-settings-item">
                      <p class="me-settings-label">${escapeHtml(selectedThread.title)}</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.subtitle ?? "Reserved thread model for future delivery surfaces.")}</p>
                    </div>
                    <div class="me-settings-item">
                      <p class="me-settings-label">Participants</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.participantLabels.join(", "))}</p>
                    </div>
                    <div class="me-settings-item">
                      <p class="me-settings-label">Latest message</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.lastMessagePreview ?? "No preview available.")}</p>
                    </div>
                    ${
                      selectedThread.syncState
                        ? `
                          <div class="me-settings-item">
                            <p class="me-settings-label">${escapeHtml(selectedThread.syncState.modeLabel ?? selectedThread.syncState.mode)}</p>
                            <p class="me-settings-value">${escapeHtml(selectedThread.syncState.statusLabel ?? `Recommended poll interval: ${selectedThread.syncState.recommendedPollIntervalMs}ms`)}</p>
                            <p class="me-settings-value">${escapeHtml(selectedThread.syncState.providerSummary ?? "External touchpoints and in-app fallback share one normalized delivery state.")}</p>
                          </div>
                        `
                        : ""
                    }
                  </section>
                `
                : `<p class="me-empty">No reserved threads available.</p>`
            }
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Notifications</p>
          <h2 class="me-card-title">Notification list</h2>
          ${
            state.items.length > 0
              ? `
                <div class="me-lesson-list">
                  ${state.items
                    .map(
                      (item) => `
                        <article class="me-lesson-card ${item.id === state.selectedItemId ? "me-lesson-card-selected" : ""} ${item.receipt.read ? "" : "me-lesson-card-just-completed"}">
                          <div class="me-lesson-meta">
                            <span class="me-lesson-index">${escapeHtml(item.groupLabel)}</span>
                            <span class="me-lesson-badge ${item.receipt.read ? "me-lesson-badge-complete" : ""}">${escapeHtml(item.receipt.read ? "Read" : "Unread")}</span>
                          </div>
                          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
                          <p class="me-lesson-subtitle">${escapeHtml(item.summary)}</p>
                          ${
                            item.bodyPreview
                              ? `<p class="me-lesson-reason">${escapeHtml(item.bodyPreview)}</p>`
                              : ""
                          }
                          <div class="me-lesson-tags">
                            <span class="me-lesson-tag">${escapeHtml(item.type)}</span>
                            ${item.tagLabels.map((tag) => `<span class="me-lesson-tag">${escapeHtml(tag)}</span>`).join("")}
                          </div>
                          <div class="me-lesson-footer">
                            <p class="me-lesson-status">${escapeHtml(item.thread?.title ?? item.createdAt)}</p>
                            <div class="me-lesson-actions">
                              <button class="me-button me-button-secondary" data-message-select="${item.id}">Select</button>
                            </div>
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="me-empty">${escapeHtml(state.emptyText)}</p>`
          }
          ${state.hasMore ? `<div class="me-action-group"><button id="messages-load-more" class="me-button me-button-ghost">Load more</button></div>` : ""}
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "messages-toggle-unread", () => {
    void runtime.pages.messages.toggleUnreadOnly().then(sync);
  });
  bindButton(root, "messages-mark-selected", () => {
    void runtime.pages.messages.markSelectedRead().then(sync);
  });
  bindButton(root, "messages-mark-visible", () => {
    void runtime.pages.messages.markVisibleRead().then(sync);
  });
  bindButton(root, "messages-settings", () => {
    void runtime.pages.messages.goToSettings().then(sync);
  });
  bindButton(root, "messages-load-more", () => {
    void runtime.pages.messages.loadMore().then(sync);
  });
  root.querySelectorAll<HTMLElement>("[data-message-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.messageType;
      if (!type) {
        return;
      }

      void runtime.pages.messages.applyType(type as MessagesState["activeType"]).then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-group]").forEach((button) => {
    button.addEventListener("click", () => {
      void runtime.pages.messages.applyGroup(button.dataset.messageGroup ?? "all").then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const notificationId = button.dataset.messageSelect;
      if (!notificationId) {
        return;
      }

      runtime.pages.messages.selectItem(notificationId);
      sync();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-thread]").forEach((button) => {
    button.addEventListener("click", () => {
      const threadId = button.dataset.messageThread;
      if (!threadId) {
        return;
      }

      runtime.pages.messages.selectThread(threadId);
      sync();
    });
  });
}

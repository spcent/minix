import type { MessagesState } from "@minix/feature-messages";

import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatDate, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderMessagesPage(state: MessagesState): string {
  const selectedThread =
    state.reservedThreads.find((thread) => thread.threadId === state.selectedThreadId) ??
    state.messageThread ??
    state.reservedThreads[0];
  const syncState = state.messageThread?.syncState ?? selectedThread?.syncState;

  return renderAppShell(
    "messages",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Reader inbox</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.subtitle ?? "Shared notifications and reserved threads stay visible inside the novel host.")}</p>
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Unread total</p>
              <p class="nh-stat-value">${escapeHtml(String(state.unreadBadge.totalUnread))}</p>
              <p class="nh-item-copy">${escapeHtml(`${state.unreadBadge.notificationUnread} notices · ${state.unreadBadge.threadUnread} thread items`)}</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Sync posture</p>
              <p class="nh-stat-value">${escapeHtml(syncState?.modeLabel ?? syncState?.mode ?? "Polling")}</p>
              <p class="nh-item-copy">${escapeHtml(syncState?.statusLabel ?? "Polling remains the explicit sync contract for this surface.")}</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Visible thread</p>
              <p class="nh-stat-value">${escapeHtml(selectedThread?.title ?? "No thread selected")}</p>
              <p class="nh-item-copy">${escapeHtml(syncState?.providerSummary ?? "Touchpoint provider posture is kept explicit in the shared thread state.")}</p>
            </article>
          </div>
          <div class="nh-actions">
            ${renderActionButton("Refresh inbox", "entry", "onShow", undefined, "primary")}
            ${renderActionButton("Mark visible read", "entry", "onTapMarkVisibleRead", undefined, "secondary")}
            ${renderActionButton("Open preferences", "entry", "onTapSettings", undefined, "secondary")}
            ${renderRouteLink("Back to discover", routePath("feed"), "ghost")}
          </div>
          ${state.lastActionMessage ? `<p class="nh-item-copy">${escapeHtml(state.lastActionMessage)}</p>` : ""}
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Transport</p>
            <h2 class="nh-cover-title">${escapeHtml(syncState?.modeLabel ?? "Polling-first inbox")}</h2>
            <p class="nh-cover-copy">${escapeHtml(syncState?.providerSummary ?? "No realtime transport is provisioned here; the host reflects the shared polling posture directly.")}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Route recovery</p>
            <p class="nh-item-copy">Inbox state preserves unread badge, selected thread, and recovery-safe navigation through shared list and detail status instead of a novel-only message model.</p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Notifications",
            title: "Visible notice list",
            copy: "The novel host now exposes the same normalized notification list the official hosts use, rather than redirecting readers elsewhere for inbox state.",
          })}
          <div class="nh-section-grid">
            ${
              state.items.length > 0
                ? state.items
                    .map(
                      (item) => `
                        <article class="nh-item">
                          <div class="nh-kicker">${escapeHtml(item.groupLabel)}</div>
                          <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                          <p class="nh-item-copy">${escapeHtml(item.summary)}</p>
                          <p class="nh-item-copy">${escapeHtml(`${formatDate(item.createdAt)} · ${item.receipt.read ? "Read" : "Unread"}`)}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `
                  <article class="nh-item">
                    <div class="nh-kicker">Empty</div>
                    <h2 class="nh-item-title">No inbox activity yet</h2>
                    <p class="nh-item-copy">${escapeHtml(state.emptyText ?? "No inbox activity is available for this reader session yet.")}</p>
                  </article>
                `
            }
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Reserved thread",
            title: selectedThread?.title ?? "Thread detail",
            copy: "Support-adjacent threads stay embedded here, with the transport posture kept explicit instead of implied.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Participants</p>
              <p class="nh-item-copy">${escapeHtml(selectedThread?.participantLabels.join(", ") ?? "No active participants")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Latest message</p>
              <p class="nh-item-copy">${escapeHtml(state.messageItems[0]?.body ?? selectedThread?.lastMessagePreview ?? "Thread detail loads after the inbox selects a reserved thread.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Actions</p>
              <div class="nh-actions">
                ${renderActionButton("Refresh inbox", "entry", "onShow", undefined, "secondary")}
                ${renderActionButton("Mark visible read", "entry", "onTapMarkVisibleRead", undefined, "ghost")}
                ${renderRouteLink("Open support", routePath("feedback"), "ghost")}
              </div>
            </article>
          </div>
        </aside>
      </section>
    `,
  );
}

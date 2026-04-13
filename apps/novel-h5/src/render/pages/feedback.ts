import type { FeedbackState } from "@minix/feature-feedback";

import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderFeedbackPage(state: FeedbackState): string {
  const selectedCategory = state.categories.find((category) => category.key === state.values.categoryKey);
  const latestStatusLabel = state.latestStatus?.label ?? "No ticket submitted yet";
  const faqEntry = state.recommendedFaqEntries[0] ?? state.faqCatalog[0];
  const supportEntry = state.supportEntry ?? state.supportEntries[0];

  return renderAppShell(
    "feedback",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Reader support</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.subtitle ?? "Report issues and continue support follow-up inside the novel host.")}</p>
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Category</p>
              <p class="nh-stat-value">${escapeHtml(selectedCategory?.label ?? "Unset")}</p>
              <p class="nh-item-copy">Bound to the shared feedback category system.</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Latest status</p>
              <p class="nh-stat-value">${escapeHtml(latestStatusLabel)}</p>
              <p class="nh-item-copy">Support state remains visible without moving to another host.</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Follow-up</p>
              <p class="nh-stat-value">${escapeHtml(state.values.revisitRequested ? "Requested" : "Optional")}</p>
              <p class="nh-item-copy">Reader can keep service-loop context attached to the ticket.</p>
            </article>
          </div>
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Captured context</p>
            <h2 class="nh-cover-title">${escapeHtml(state.values.sourcePage || "/feedback")}</h2>
            <p class="nh-cover-copy">${escapeHtml(`${state.values.platform} · ${state.values.appVersion} · ${state.values.deviceSummary ?? "device summary pending"}`)}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Service hint</p>
            <p class="nh-item-copy">${escapeHtml(state.serviceLoopSummary ?? state.serviceHint ?? "Support guidance appears here after bootstrap.")}</p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Draft ticket",
            title: "Keep the ticket editable before you submit it.",
            copy: "This is a light host-local surface over the shared feedback controller, so the model, validation, and follow-up state stay consistent across hosts.",
          })}
          <div class="nh-grid">
            <label class="nh-panel">
              <p class="nh-meta-label">Title</p>
              <input class="nh-input" type="text" value="${escapeHtml(state.values.title)}" placeholder="Describe the issue briefly" data-feedback-input="title" />
            </label>
            <label class="nh-panel">
              <p class="nh-meta-label">Description</p>
              <textarea class="nh-textarea" rows="6" placeholder="Add steps, expectations, and what happened instead." data-feedback-input="description">${escapeHtml(state.values.description)}</textarea>
            </label>
          </div>
          <div class="nh-actions">
            ${state.categories
              .slice(0, 3)
              .map((category) =>
                renderActionButton(category.label, "controller", "setCategory", category.key, category.key === state.values.categoryKey ? "primary" : "secondary"),
              )
              .join("")}
          </div>
          <div class="nh-actions">
            ${renderActionButton("Issue report", "controller", "setType", "issue_report", state.values.type === "issue_report" ? "primary" : "secondary")}
            ${renderActionButton("Suggestion", "controller", "setType", "suggestion", state.values.type === "suggestion" ? "primary" : "secondary")}
            ${renderActionButton("Toggle follow-up", "controller", "toggleRevisitRequested", undefined, "ghost")}
          </div>
          <div class="nh-actions">
            ${renderActionButton("Save draft", "controller", "saveDraft", undefined, "secondary")}
            ${renderActionButton("Submit ticket", "controller", "submit", undefined, "primary")}
            ${renderActionButton("Refresh status", "controller", "refreshLatestStatus", state.latestTicket?.ticketId, "ghost")}
          </div>
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
          ${state.validationErrors.length > 0 ? `<p class="nh-item-copy">${escapeHtml(state.validationErrors.map((item) => item.message).join(" · "))}</p>` : ""}
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Follow-up lane",
            title: supportEntry?.label ?? "Support next step",
            copy: "Support does not need a separate novel-host implementation if the shared feedback model can describe the return path clearly.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">FAQ</p>
              <p class="nh-item-copy">${escapeHtml(faqEntry?.summary ?? "No FAQ recommendation yet.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Support entry</p>
              <p class="nh-item-copy">${escapeHtml(supportEntry?.summary ?? "No support entry is configured yet.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Actions</p>
              <div class="nh-actions">
                ${renderActionButton("Open support entry", "controller", "openSupportEntry", undefined, "secondary")}
                ${renderActionButton("Open FAQ", "controller", "openFaq", faqEntry?.entryId, "ghost")}
                ${renderRouteLink("Open account", routePath("account"), "ghost")}
              </div>
            </article>
          </div>
        </aside>
      </section>
    `,
  );
}

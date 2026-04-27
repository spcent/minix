import type { FeedbackState } from "@minix/feature-feedback";

import { renderActionRow } from "../components/action-row";
import { renderInfoPanel } from "../components/info-panel";
import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
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
            ${renderStatPanels([
              {
                label: "Category",
                value: selectedCategory?.label ?? "Unset",
                note: "Bound to the shared feedback category system.",
              },
              {
                label: "Latest status",
                value: latestStatusLabel,
                note: "Support state remains visible without moving to another host.",
              },
              {
                label: "Follow-up",
                value: state.values.revisitRequested ? "Requested" : "Optional",
                note: "Reader can keep service-loop context attached to the ticket.",
              },
            ])}
          </div>
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Captured context</p>
            <h2 class="nh-cover-title">${escapeHtml(state.values.sourcePage || "/feedback")}</h2>
            <p class="nh-cover-copy">${escapeHtml(`${state.values.platform} · ${state.values.appVersion} · ${state.values.deviceSummary ?? "device summary pending"}`)}</p>
          </div>
          ${renderInfoPanel({
            label: "Service hint",
            copy: state.serviceLoopSummary ?? state.serviceHint ?? "Support guidance appears here after bootstrap.",
            className: "nh-panel nh-issue-panel",
          })}
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
          ${renderActionRow(
            state.categories
              .slice(0, 3)
              .map((category) =>
                renderActionButton(category.label, "controller", "setCategory", category.key, category.key === state.values.categoryKey ? "primary" : "secondary"),
              ),
          )}
          ${renderActionRow([
            renderActionButton("Issue report", "controller", "setType", "issue_report", state.values.type === "issue_report" ? "primary" : "secondary"),
            renderActionButton("Suggestion", "controller", "setType", "suggestion", state.values.type === "suggestion" ? "primary" : "secondary"),
            renderActionButton("Toggle follow-up", "controller", "toggleRevisitRequested", undefined, "ghost"),
          ])}
          ${renderActionRow([
            renderActionButton("Save draft", "controller", "saveDraft", undefined, "secondary"),
            renderActionButton("Submit ticket", "controller", "submit", undefined, "primary"),
            renderActionButton("Refresh status", "controller", "refreshLatestStatus", state.latestTicket?.ticketId, "ghost"),
          ])}
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
            ${renderInfoPanel({
              label: "FAQ",
              copy: faqEntry?.summary ?? "No FAQ recommendation yet.",
            })}
            ${renderInfoPanel({
              label: "Support entry",
              copy: supportEntry?.summary ?? "No support entry is configured yet.",
            })}
            ${renderInfoPanel({
              label: "Actions",
              actions: [
                renderActionButton("Open support entry", "controller", "openSupportEntry", undefined, "secondary"),
                renderActionButton("Open FAQ", "controller", "openFaq", faqEntry?.entryId, "ghost"),
                renderRouteLink("Open account", routePath("account"), "ghost"),
              ],
            })}
          </div>
        </aside>
      </section>
    `,
  );
}

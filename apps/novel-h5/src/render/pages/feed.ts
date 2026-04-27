import type { FeedState } from "@minix/feature-feed";

import { renderActionRow } from "../components/action-row";
import { renderInfoPanel } from "../components/info-panel";
import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderFeedPage(state: FeedState): string {
  const topItems = state.items.slice(0, 4);
  const resultCount = state.searchResults?.total ?? state.items.length;
  const reviewCount = state.reviewQueue.length;
  const reviewPreview = state.reviewQueue.slice(0, 3);

  return renderAppShell(
    "feed",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Editorial discover</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.subtitle)}</p>
          <div class="nh-stat-strip">
            ${renderStatPanels([
              {
                label: "Visible results",
                value: String(resultCount).padStart(2, "0"),
                note: "Shared discovery results returned through the feed contract.",
              },
              {
                label: "Active lane",
                value: state.query.domain,
                note: "Discovery stays bounded instead of hiding inside the novel-only storefront.",
              },
              {
                label: "Review queue",
                value: String(reviewCount).padStart(2, "0"),
                note: "Managed-content lifecycle remains owned by the shared feed feature.",
              },
            ])}
          </div>
          ${renderActionRow([
            renderActionButton("Refresh discover", "entry", "onShow", undefined, "primary"),
            renderActionButton("Open preferences", "entry", "onTapSettings", undefined, "secondary"),
            renderRouteLink("Back to library", routePath("catalog"), "ghost"),
          ])}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Why this page exists</p>
            <h2 class="nh-cover-title">Novel reading stays on the catalog and reader extension layer.</h2>
            <p class="nh-cover-copy">Discover carries shared editorial search and managed-content entry so the standalone novel hosts do not bury cross-domain content behind library-only routes.</p>
          </div>
          ${renderInfoPanel({
            label: "CMS boundary",
            copy: "Drafting, lifecycle actions, and review queue state still live in the shared feed controller. This host only exposes the entry surface deliberately.",
            className: "nh-panel nh-issue-panel",
          })}
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Discover preview",
            title: "Shared editorial results now have an explicit route on the novel hosts.",
            copy: state.searchResults?.featuredReason ?? "The discover surface should explain why a result is visible before the reader commits to a deeper route.",
          })}
          <div class="nh-section-grid">
            ${
              topItems.length > 0
                ? topItems
                    .map(
                      (item) => `
                        <article class="nh-item">
                          <div class="nh-kicker">${escapeHtml(item.tag ?? "content")}</div>
                          <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                          <p class="nh-item-copy">${escapeHtml(item.subtitle ?? item.recommendedReason ?? "Shared editorial content preview.")}</p>
                          ${
                            item.recommendedReason
                              ? `<p class="nh-item-copy">${escapeHtml(item.recommendedReason)}</p>`
                              : ""
                          }
                        </article>
                      `,
                    )
                    .join("")
                : `
                  <article class="nh-item">
                    <div class="nh-kicker">Discover state</div>
                    <h2 class="nh-item-title">No results are loaded yet.</h2>
                    <p class="nh-item-copy">${escapeHtml(state.errorText ?? state.emptyText ?? "Refresh discover to load the shared editorial lane.")}</p>
                  </article>
                `
            }
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Managed content",
            title: "Shared authoring and review stay visible without creating a host-local CMS.",
            copy: "This route is the deliberate studio entry for the official sample surface, while the shared feed feature remains the source of truth.",
            compact: true,
          })}
          <div class="nh-grid">
            ${renderInfoPanel({
              label: "Draft workflow",
              copy: state.contentDraftForm.subtitle ?? "Authoring workflow for managed content.",
            })}
            ${renderInfoPanel({
              label: "Draft recovery",
              copy: state.contentDraftForm.workflow.draft ? "Local draft recovery is available on this host." : "No local draft snapshot is saved yet.",
            })}
            ${renderInfoPanel({
              label: "Search posture",
              copy: state.query.keyword ? `Current keyword: ${state.query.keyword}` : "No keyword applied yet. The bounded discover route is ready for editorial and recommendation search.",
            })}
            ${renderInfoPanel({
              label: "Return path",
              copy: "Use Discover for shared editorial search, then return to Library, Detail, or Reader for the novel-specific extension flow.",
            })}
          </div>
          ${renderActionRow([
            renderActionButton("Refresh review queue", "controller", "loadReviewQueue", undefined, "secondary"),
            renderActionButton("Save local draft snapshot", "controller", "saveContentDraftSnapshot", undefined, "ghost"),
          ])}
          ${
            reviewPreview.length > 0
              ? `
                <div class="nh-section-grid">
                  ${reviewPreview
                    .map(
                      (item) => `
                        <article class="nh-item">
                          <div class="nh-kicker">${escapeHtml(item.lifecycleState)}</div>
                          <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                          <p class="nh-item-copy">${escapeHtml(item.queueLabel)}</p>
                          <p class="nh-item-copy">${escapeHtml(item.reviewerLabel ?? "Reviewer assignment pending")}</p>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="nh-copy">${escapeHtml(state.contentTransitionFeedback ?? "Refresh the shared review queue when editorial work is active.")}</p>`
          }
        </aside>
      </section>
    `,
  );
}

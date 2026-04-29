import { escapeHtml } from "@minix/core";
import type { FeedState } from "@minix/feature-feed";

import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

export function renderFeedPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.feed.store.getState() as FeedState;
  const recentKeywords = state.searchResults?.recentKeywords ?? state.recentKeywords;
  const hotKeywords = state.searchResults?.hotKeywords ?? [];
  const suggestionTerms = state.searchResults?.suggestionTerms ?? [];
  const draftState = state.contentDraftForm.workflow.draft;
  const reviewPreview = state.reviewQueue.slice(0, 3);

  renderApp(
    root,
    "Discovery Feed",
    runtime,
    "feed",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Discover</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.searchQuery?.mode ?? "global")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(state.searchQuery?.domain ?? "feed")}</span>
              <span class="me-chip">${escapeHtml(`${state.searchResults?.total ?? state.items.length} results`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Search Surface</p>
            <h2 class="me-panel-title">Normalized shared output</h2>
            <ul class="me-panel-list">
              <li>${escapeHtml(`Keyword: ${state.searchQuery?.keyword || "None"}`)}</li>
              <li>${escapeHtml(`Active tag: ${state.activeTag ?? "all"}`)}</li>
              <li>${escapeHtml(`Sort: ${state.searchResults?.activeSortKey ?? "recommended"}`)}</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Search</p>
            <h2 class="me-card-title">Keyword and reusable terms</h2>
            <div class="me-action-group">
              <input id="feed-keyword" class="me-input" value="${escapeHtml(state.query.keyword)}" placeholder="Search discovery content" />
              <button id="feed-submit" class="me-button me-button-primary">Search</button>
              <button id="feed-clear" class="me-button me-button-secondary">Clear</button>
            </div>
            <div class="me-chip-row">
              ${hotKeywords.map((keyword) => `<button class="me-filter-button" data-feed-keyword="${escapeHtml(keyword)}">${escapeHtml(keyword)}</button>`).join("")}
            </div>
            ${
              recentKeywords.length > 0
                ? `
                  <div class="me-chip-row">
                    ${recentKeywords
                      .map((keyword) => `<button class="me-filter-button" data-feed-keyword="${escapeHtml(keyword)}">${escapeHtml(keyword)}</button>`)
                      .join("")}
                  </div>
                `
                : ""
            }
            ${
              suggestionTerms.length > 0
                ? `<p class="me-copy-muted">${escapeHtml(`Suggested next terms: ${suggestionTerms.join(", ")}`)}</p>`
                : ""
            }
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Filters</p>
            <h2 class="me-card-title">Content lanes</h2>
            <div class="me-chip-row">
              ${state.tags
                .map(
                  (tag) =>
                    `<button class="me-filter-button ${state.activeTag === tag.key || (!state.activeTag && tag.key === "all") ? "me-filter-button-active" : ""}" data-feed-tag="${tag.key}">${escapeHtml(tag.label)}</button>`,
                )
                .join("")}
            </div>
            <p class="me-copy-muted">${escapeHtml(state.featuredReason ?? "Shared feed reasoning appears here after the first result loads.")}</p>
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Results</p>
          <h2 class="me-card-title">Feed results</h2>
          ${
            state.items.length > 0
              ? `
                <div class="me-task-list">
                  ${state.items
                    .map(
                      (item) => `
                        <article class="me-task-card">
                          <p class="me-task-meta">${escapeHtml(item.eyebrow ?? item.tag ?? "Feed")}</p>
                          <h3 class="me-task-title">${escapeHtml(item.title)}</h3>
                          <p class="me-task-copy">${escapeHtml(item.subtitle ?? "")}</p>
                          <p class="me-task-copy">${escapeHtml(item.recommendedReason ?? "")}</p>
                          <div class="me-action-group">
                            <button class="me-button me-button-secondary" data-feed-open="${item.id}">Open</button>
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="me-empty">${escapeHtml(state.searchResults?.emptyText ?? state.emptyText)}</p>`
          }
          ${state.hasMore ? `<div class="me-action-group"><button id="feed-load-more" class="me-button me-button-ghost">Load more</button></div>` : ""}
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Studio Lane</p>
            <h2 class="me-card-title">Managed content stays on this shared route</h2>
            <section class="me-settings-section">
              <div class="me-settings-item">
                <p class="me-settings-label">Draft workflow</p>
                <p class="me-settings-value">${escapeHtml(state.contentDraftForm.subtitle ?? "Authoring workflow for managed content.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Current step</p>
                <p class="me-settings-value">${escapeHtml(state.contentDraftForm.workflow.currentStepKey ?? "basics")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Local recovery</p>
                <p class="me-settings-value">${escapeHtml(draftState ? "Draft snapshot saved for this host." : "No local draft snapshot saved yet.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Review queue</p>
                <p class="me-settings-value">${escapeHtml(`${String(state.reviewQueue.length)} items${state.selectedReviewContentId ? ` · selected ${state.selectedReviewContentId}` : ""}`)}</p>
              </div>
            </section>
            ${state.contentTransitionFeedback ? `<p class="me-copy-muted">${escapeHtml(state.contentTransitionFeedback)}</p>` : ""}
            <div class="me-action-group">
              <button id="feed-review-queue" class="me-button me-button-secondary">Refresh review queue</button>
              <button id="feed-save-snapshot" class="me-button me-button-ghost">Save local draft snapshot</button>
            </div>
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Review Queue</p>
            <h2 class="me-card-title">Editorial review preview</h2>
            ${
              reviewPreview.length > 0
                ? `
                  <div class="me-task-list">
                    ${reviewPreview
                      .map(
                        (item) => `
                          <article class="me-task-card">
                            <p class="me-task-meta">${escapeHtml(`${item.lifecycleState} · ${item.visibility}`)}</p>
                            <h3 class="me-task-title">${escapeHtml(item.title)}</h3>
                            <p class="me-task-copy">${escapeHtml(item.queueLabel)}</p>
                            <p class="me-task-copy">${escapeHtml(item.reviewerLabel ?? "Reviewer assignment pending")}</p>
                          </article>
                        `,
                      )
                      .join("")}
                  </div>
                `
                : `<p class="me-empty">No review-queue items are loaded yet. Refresh this bounded studio lane when editorial work is active.</p>`
            }
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "feed-submit", () => {
    const keyword = root.querySelector<HTMLInputElement>("#feed-keyword")?.value ?? "";
    runtime.pages.feed.setKeyword(keyword);
    void runtime.pages.feed.submitSearch().then(sync);
  });
  bindButton(root, "feed-clear", () => {
    void runtime.pages.feed.clearSearch().then(sync);
  });
  bindButton(root, "feed-load-more", () => {
    void runtime.pages.feed.loadMore().then(sync);
  });
  bindButton(root, "feed-review-queue", () => {
    void runtime.pages.feed.loadReviewQueue().then(sync);
  });
  bindButton(root, "feed-save-snapshot", () => {
    void runtime.pages.feed.saveContentDraftSnapshot().then(sync);
  });
  root.querySelectorAll<HTMLElement>("[data-feed-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      void runtime.pages.feed.applyTag(button.dataset.feedTag).then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feed-keyword]").forEach((button) => {
    button.addEventListener("click", () => {
      const keyword = button.dataset.feedKeyword ?? "";
      runtime.pages.feed.setKeyword(keyword);
      void runtime.pages.feed.submitSearch().then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feed-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.feedOpen;
      void runtime.pages.feed.openItem(itemId).then(sync);
    });
  });
}

import type { CatalogState } from "@minix/feature-catalog";

import type { NovelH5PageRenderContext } from "../types";
import { renderNovelCard } from "../components/novel-card";
import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatCompactNumber, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderCatalogPage(context: NovelH5PageRenderContext, state: CatalogState): string {
  const selected = state.items.find((item) => item.id === state.selectedNovelId) ?? state.items[0];
  const serialCount = state.items.filter((item) => item.status === "serializing").length;
  const premiumCount = state.items.filter((item) => item.requiresMembership).length;
  const hasSearchKeyword = state.query.keyword.trim().length > 0;
  const resultCards =
    state.items.length > 0
      ? state.items
          .map((item) =>
            renderNovelCard(item, {
              active: state.selectedNovelId === item.id,
              primary: { label: "Focus", action: "selectNovel", value: item.id, variant: "secondary" },
              secondary: {
                label: item.continueChapterId ? "Continue" : "Open detail",
                action: item.continueChapterId ? "continueReading" : "goToNovelDetail",
                value: item.id,
                variant: "ghost",
              },
              highlight: item.recommendedReason ?? item.continueChapterTitle ?? item.latestChapterTitle ?? "Queued for release",
            }),
          )
              .join("")
      : `
        <div class="nh-empty-state">
          <p class="nh-copy">
            ${
              state.errorText
                ? escapeHtml(state.errorText)
                : hasSearchKeyword
                  ? escapeHtml(`No titles matched "${state.query.keyword}". Try a recent search, a hot keyword, or clear the query.`)
                  : escapeHtml(state.emptyText ?? "No novels available.")
            }
          </p>
          ${
            hasSearchKeyword
              ? `<div class="nh-actions">
                  ${renderActionButton("Clear search", "controller", "clearSearch", undefined, "secondary")}
                  ${
                    state.hotKeywords[0]
                      ? renderActionButton(`Try ${state.hotKeywords[0]}`, "controller", "applySearchKeyword", state.hotKeywords[0], "ghost")
                      : ""
                  }
                </div>`
              : ""
          }
        </div>`;

  const sortButtons = [
    { label: "Recommended", value: "recommended" },
    { label: "Freshest", value: "updatedAt" },
    { label: "Popular", value: "popular" },
    { label: "Longest", value: "wordCount" },
  ];

  const cards =
    selected
      ? `
        <article class="nh-spotlight-card">
          <div class="nh-grid">
            <div class="nh-kicker">Selected title</div>
            <h2 class="nh-title-small">${escapeHtml(selected.title)}</h2>
            <p class="nh-copy">${escapeHtml(selected.summary)}</p>
            <div class="nh-chip-row">
              <span class="nh-chip">${escapeHtml(selected.categoryLabel)}</span>
              <span class="nh-chip">${escapeHtml(selected.status)}</span>
              ${selected.requiresMembership ? '<span class="nh-chip">Membership</span>' : '<span class="nh-chip">Open reading</span>'}
              ${selected.continueChapterId ? '<span class="nh-chip">Resume ready</span>' : ""}
            </div>
            <div class="nh-stat-strip">
              <article class="nh-stat-panel">
                <p class="nh-meta-label">Readers</p>
                <p class="nh-stat-value">${formatCompactNumber(selected.readingCount)}</p>
              </article>
              <article class="nh-stat-panel">
                <p class="nh-meta-label">Shelves</p>
                <p class="nh-stat-value">${formatCompactNumber(selected.bookshelfCount)}</p>
              </article>
              <article class="nh-stat-panel">
                <p class="nh-meta-label">Words</p>
                <p class="nh-stat-value">${formatCompactNumber(selected.wordCount)}</p>
              </article>
            </div>
            <p class="nh-item-copy">
              ${escapeHtml(
                state.selectedReason ??
                  (selected.continueChapterTitle
                    ? `Resume from ${selected.continueChapterTitle} without leaving the library flow.`
                    : "Open detail when there is no saved reading session yet."),
              )}
            </p>
            <div class="nh-actions">
              ${renderActionButton(
                selected.continueChapterId ? "Continue reading" : "Open detail",
                "controller",
                selected.continueChapterId ? "continueReading" : "goToNovelDetail",
                selected.id,
                "primary",
              )}
              ${renderRouteLink("Membership", routePath("membership"), "ghost")}
            </div>
          </div>
        </article>
      `
      : "";

  return renderAppShell(
    "catalog",
    `
      <section class="nh-card nh-catalog-hero">
        <div class="nh-grid">
          <div class="nh-kicker">Library</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">The catalog should read like an operational storefront: searchable, filterable, merchandised, and ready to route into detail or membership flows.</p>
        </div>
        <div class="nh-searchbar">
          <input class="nh-input" type="search" placeholder="Search by title, author, or summary" value="${escapeHtml(state.query.keyword)}" data-input="catalog-keyword" />
          ${renderActionButton("Search", "controller", "submitSearch", undefined, "primary")}
          ${renderActionButton("Clear", "controller", "clearSearch", undefined, "ghost")}
        </div>
        <div class="nh-grid">
          <article class="nh-panel">
            <p class="nh-meta-label">Popular searches</p>
            <div class="nh-chip-row">
              ${state.hotKeywords
                .map((keyword) => renderActionButton(keyword, "controller", "applySearchKeyword", keyword, "ghost"))
                .join("")}
            </div>
          </article>
          ${
            state.recentSearches.length > 0
              ? `
                <article class="nh-panel">
                  <p class="nh-meta-label">Recent searches</p>
                  <div class="nh-chip-row">
                    ${state.recentSearches
                      .map((keyword) => renderActionButton(keyword, "controller", "applySearchKeyword", keyword, "secondary"))
                      .join("")}
                  </div>
                </article>
              `
              : ""
          }
        </div>
        <div class="nh-stat-strip">
          <article class="nh-stat-panel">
            <p class="nh-meta-label">Results</p>
            <p class="nh-stat-value">${String(state.items.length).padStart(2, "0")}</p>
            <p class="nh-item-copy">Visible after filtering</p>
          </article>
          <article class="nh-stat-panel">
            <p class="nh-meta-label">Serials</p>
            <p class="nh-stat-value">${String(serialCount).padStart(2, "0")}</p>
            <p class="nh-item-copy">Release-driven titles</p>
          </article>
          <article class="nh-stat-panel">
            <p class="nh-meta-label">Premium</p>
            <p class="nh-stat-value">${String(premiumCount).padStart(2, "0")}</p>
            <p class="nh-item-copy">Membership-aware inventory</p>
          </article>
        </div>
      </section>
      <section class="nh-catalog-layout">
        <aside class="nh-card nh-filter-rail">
          ${renderSectionHeading({
            kicker: "Filter rail",
            title: "Treat discovery controls as first-class product UI.",
            copy: "Filters should feel like curation tools, not leftover admin switches.",
            compact: true,
          })}
          <div class="nh-grid">
            <div class="nh-filter-group">
              <p class="nh-meta-label">Categories</p>
              <div class="nh-chip-row">
                ${state.categories
                  .map((category) =>
                    renderActionButton(
                      category.label,
                      "controller",
                      "applyCategory",
                      category.key,
                      state.activeCategoryKey === category.key ? "primary" : "secondary",
                    ),
                  )
                  .join("")}
              </div>
            </div>
            <div class="nh-filter-group">
              <p class="nh-meta-label">Status</p>
              <div class="nh-chip-row">
                ${state.statusOptions
                  .map((status) =>
                    renderActionButton(
                      status.label,
                      "controller",
                      "applyStatus",
                      status.key,
                      state.activeStatus === status.key ? "primary" : "ghost",
                    ),
                  )
                  .join("")}
              </div>
            </div>
            <div class="nh-filter-group">
              <p class="nh-meta-label">Sort</p>
              <div class="nh-chip-row">
                ${sortButtons
                  .map((sort) =>
                    renderActionButton(
                      sort.label,
                      "controller",
                      "applySort",
                      sort.value,
                      state.sort === sort.value ? "primary" : "ghost",
                    ),
                  )
                  .join("")}
              </div>
            </div>
            <article class="nh-panel">
              <p class="nh-meta-label">Current query</p>
              <p class="nh-item-copy">
                ${escapeHtml(
                  state.query.keyword
                    ? `Searching for "${state.query.keyword}" with ${state.activeCategoryKey === "all" ? "all categories" : state.activeCategoryKey}.`
                    : "No keyword applied. This is the full frontlist.",
                )}
              </p>
              ${state.selectedReason ? `<p class="nh-item-copy">${escapeHtml(state.selectedReason)}</p>` : ""}
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Because you read...</p>
              <p class="nh-item-copy">${escapeHtml(state.continueReason ?? "Once reading progress exists, the catalog should surface the strongest return path before cold browsing.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Recently updated on your shelf</p>
              <p class="nh-item-copy">${escapeHtml(state.updateReason ?? "Fresh serial movement should stay visible as a dedicated lane, not disappear into result metadata.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Frontlist note</p>
              <p class="nh-item-copy">${escapeHtml(state.frontlistReason ?? "One title should still anchor the frontlist even when the library is filtered or searched.")}</p>
            </article>
          </div>
        </aside>
        <div class="nh-grid">
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Selection spotlight",
              title: "Keep one title in focus while the user scans the list.",
              copy: escapeHtml(state.frontlistReason ?? "The selected novel gives the page a merchandising anchor instead of a flat grid."),
            })}
            ${cards}
          </section>
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Recommendation lanes",
              title: "Every major lane should answer why it is being surfaced now.",
              copy: "Use shared recommendation reasons so search, home, and catalog stay aligned on the meaning of each lane.",
            })}
            <div class="nh-grid">
              <article class="nh-panel">
                <p class="nh-meta-label">Because you read...</p>
                <p class="nh-item-copy">${escapeHtml(state.continueReason ?? "Saved progress will promote the fastest route back into a live reading session.")}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Recently updated on your shelf</p>
                <p class="nh-item-copy">${escapeHtml(state.updateReason ?? "Recent chapter movement should stay visible without scanning the whole result set.")}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Membership lane</p>
                <p class="nh-item-copy">${escapeHtml(state.membershipReason ?? "Premium discovery should remain quiet, legible, and clearly separate from core return paths.")}</p>
              </article>
            </div>
          </section>
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Results",
              title: "Search, browse, and compare inventory quickly.",
              copy: "Each result card exposes reading state, chapter freshness, and access level without opening detail first.",
            })}
            <div class="nh-section-grid">
              ${resultCards}
            </div>
          </section>
        </div>
      </section>
    `,
  );
}

import type { CatalogState } from "@minix/feature-catalog";

import type { NovelH5PageRenderContext } from "../types";
import { renderActionRow } from "../components/action-row";
import { renderChipRow } from "../components/chip-row";
import { renderEmptyState } from "../components/empty-state";
import { renderInfoPanel } from "../components/info-panel";
import { renderNovelCard } from "../components/novel-card";
import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatCompactNumber, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderCatalogPage(context: NovelH5PageRenderContext, state: CatalogState): string {
  const selected = state.items.find((item) => item.id === state.selectedNovelId) ?? state.items[0];
  const serialCount = state.items.filter((item) => item.status === "serializing").length;
  const premiumCount = state.items.filter((item) => item.requiresMembership).length;
  const hasSearchKeyword = state.query.keyword.trim().length > 0;
  const emptyResultCopy = state.errorText
    ? state.errorText
    : hasSearchKeyword
      ? `No titles matched "${state.query.keyword}". Try a recent search, a hot keyword, or clear the query.`
      : state.emptyText ?? "No novels available.";
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
      : renderEmptyState(
          emptyResultCopy,
          hasSearchKeyword
            ? [
                renderActionButton("Clear search", "controller", "clearSearch", undefined, "secondary"),
                state.hotKeywords[0]
                  ? renderActionButton(`Try ${state.hotKeywords[0]}`, "controller", "applySearchKeyword", state.hotKeywords[0], "ghost")
                  : undefined,
              ]
            : [],
        );

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
            ${renderChipRow([
              selected.categoryLabel,
              selected.status,
              selected.requiresMembership ? "Membership" : "Open reading",
              selected.continueChapterId ? "Resume ready" : undefined,
            ])}
            <div class="nh-stat-strip">
              ${renderStatPanels([
                { label: "Readers", value: formatCompactNumber(selected.readingCount) },
                { label: "Shelves", value: formatCompactNumber(selected.bookshelfCount) },
                { label: "Words", value: formatCompactNumber(selected.wordCount) },
              ])}
            </div>
            <p class="nh-item-copy">
              ${escapeHtml(
                state.selectedReason ??
                  (selected.continueChapterTitle
                    ? `Resume from ${selected.continueChapterTitle} without leaving the library flow.`
                    : "Open detail when there is no saved reading session yet."),
              )}
            </p>
            ${renderActionRow([
              renderActionButton(
                selected.continueChapterId ? "Continue reading" : "Open detail",
                "controller",
                selected.continueChapterId ? "continueReading" : "goToNovelDetail",
                selected.id,
                "primary",
              ),
              renderRouteLink("Editorial discover", routePath("feed"), "button"),
              renderRouteLink("Membership", routePath("membership"), "ghost"),
            ])}
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
          ${renderStatPanels([
            { label: "Results", value: String(state.items.length).padStart(2, "0"), note: "Visible after filtering" },
            { label: "Serials", value: String(serialCount).padStart(2, "0"), note: "Release-driven titles" },
            { label: "Premium", value: String(premiumCount).padStart(2, "0"), note: "Membership-aware inventory" },
          ])}
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
            ${renderInfoPanel({
              label: "Because you read...",
              copy: state.continueReason ?? "Once reading progress exists, the catalog should surface the strongest return path before cold browsing.",
            })}
            ${renderInfoPanel({
              label: "Recently updated on your shelf",
              copy: state.updateReason ?? "Fresh serial movement should stay visible as a dedicated lane, not disappear into result metadata.",
            })}
            ${renderInfoPanel({
              label: "Frontlist note",
              copy: state.frontlistReason ?? "One title should still anchor the frontlist even when the library is filtered or searched.",
            })}
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
              ${renderInfoPanel({
                label: "Because you read...",
                copy: state.continueReason ?? "Saved progress will promote the fastest route back into a live reading session.",
              })}
              ${renderInfoPanel({
                label: "Recently updated on your shelf",
                copy: state.updateReason ?? "Recent chapter movement should stay visible without scanning the whole result set.",
              })}
              ${renderInfoPanel({
                label: "Membership lane",
                copy: state.membershipReason ?? "Premium discovery should remain quiet, legible, and clearly separate from core return paths.",
              })}
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

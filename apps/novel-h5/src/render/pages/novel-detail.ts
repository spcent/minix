import type { NovelDetailState } from "@minix/feature-novel-detail";

import type { NovelH5PageRenderContext } from "../types";
import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatCompactNumber, formatDate, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderNovelDetailPage(context: NovelH5PageRenderContext, state: NovelDetailState): string {
  const detail = state.detail;
  if (!detail) {
    return renderAppShell("novelDetail", `<section class="nh-card"><p class="nh-copy">${escapeHtml(state.errorText ?? "Novel detail is loading.")}</p></section>`);
  }

  const accessLabels = [
    detail.isFree ? "Free entry" : null,
    detail.isTrial ? "Trial enabled" : null,
    detail.requiresMembership ? "Membership title" : "Open catalog title",
    detail.isPurchased ? "Purchased" : null,
    detail.inBookshelf ? "On shelf" : null,
  ].filter((value): value is string => Boolean(value));

  return renderAppShell(
    "novelDetail",
    `
      <section class="nh-card nh-detail-hero">
        <div class="nh-hero-grid">
          <div class="nh-grid nh-hero-copy">
            <div class="nh-kicker">${escapeHtml(detail.categoryLabel)}</div>
            <h1 class="nh-title">${escapeHtml(detail.title)}</h1>
            <p class="nh-copy">${escapeHtml(detail.subtitle ?? "A high-fidelity detail page should convert curiosity into reading intent.")}</p>
            <div class="nh-chip-row">
              ${detail.tags.map((tag) => `<span class="nh-chip">${escapeHtml(tag.label)}</span>`).join("")}
              <span class="nh-chip">${escapeHtml(detail.status)}</span>
              ${detail.requiresMembership ? '<span class="nh-chip">Membership title</span>' : ""}
              ${state.accessBadgeLabel ? `<span class="nh-chip">${escapeHtml(state.accessBadgeLabel)}</span>` : ""}
            </div>
            ${state.membershipMessage ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.membershipMessage)}</p></div>` : ""}
            ${state.bookshelfNotice ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.bookshelfNotice)}</p></div>` : ""}
            <div class="nh-actions">
              ${renderActionButton(state.primaryActionLabel ?? "Continue reading", "controller", "continueReading", undefined, "primary")}
              ${renderActionButton("Open directory", "controller", "goToToc", undefined, "secondary")}
              ${
                detail.inBookshelf
                  ? renderActionButton(state.bookshelfBusy ? "Removing..." : "Remove from shelf", "controller", "removeFromBookshelf", undefined, "ghost")
                  : renderActionButton(state.bookshelfBusy ? "Adding..." : "Add to shelf", "controller", "addToBookshelf", undefined, "ghost")
              }
              ${renderActionButton(state.summaryExpanded ? "Collapse summary" : "Expand summary", "controller", "toggleSummary", undefined, "ghost")}
              ${renderActionButton("Library", "controller", "goToCatalog", undefined, "ghost")}
            </div>
          </div>
          <aside class="nh-grid">
            <div class="nh-cover">
              <p class="nh-cover-kicker">${escapeHtml(detail.author.name)}</p>
              <h2 class="nh-cover-title">${escapeHtml(detail.title)}</h2>
              <p class="nh-cover-copy">Latest chapter: ${escapeHtml(detail.latestChapter?.title ?? "Upcoming update")}</p>
            </div>
            <article class="nh-panel nh-issue-panel">
              <p class="nh-meta-label">Reading access</p>
              <div class="nh-chip-row">
                ${accessLabels.map((label) => `<span class="nh-chip">${escapeHtml(label)}</span>`).join("")}
              </div>
              <div class="nh-item-metadata">
                ${detail.ratingScore !== undefined ? `<span>${escapeHtml(detail.ratingScore.toFixed(1))} score</span>` : ""}
                ${detail.ratingCount !== undefined ? `<span>${formatCompactNumber(detail.ratingCount)} ratings</span>` : ""}
                ${detail.favoriteCount !== undefined ? `<span>${formatCompactNumber(detail.favoriteCount)} favorites</span>` : ""}
              </div>
              <p class="nh-item-copy">
                ${escapeHtml(
                  state.accessSummary ??
                    (detail.requiresMembership
                      ? "Membership logic is visible here before the user reaches the reader, which makes pricing and access feel intentional."
                      : "Open titles still surface continuation, update cadence, and reading depth like a premium storefront."),
                )}
              </p>
              <div class="nh-actions">
                ${
                  state.membershipLocked
                    ? renderActionButton(state.membershipActionLabel ?? "Unlock membership", "controller", "goToMembership", undefined, "primary")
                    : detail.inBookshelf
                      ? renderActionButton(state.bookshelfBusy ? "Removing..." : "Remove from shelf", "controller", "removeFromBookshelf", undefined, "ghost")
                      : renderActionButton(state.bookshelfBusy ? "Adding..." : "Add to shelf", "controller", "addToBookshelf", undefined, "primary")
                }
                ${renderRouteLink("Open shelf", routePath("bookshelf"), "ghost")}
              </div>
            </article>
          </aside>
        </div>
      </section>
      <section class="nh-detail-layout">
        <div class="nh-grid">
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Story dossier",
              title: "The synopsis should carry emotional and commercial weight.",
              copy: escapeHtml(detail.authorPresenceLabel ?? "This section needs enough room for editorial writing, not just metadata labels."),
            })}
            <p class="nh-copy nh-detail-summary">
              ${escapeHtml(state.summaryExpanded ? detail.summary : `${detail.summary.slice(0, 320)}${detail.summary.length > 320 ? "..." : ""}`)}
            </p>
            <div class="nh-meta-grid nh-meta-grid-wide">
              <div class="nh-meta-block"><p class="nh-meta-label">Chapters</p><p class="nh-meta-value">${detail.chapterCount}</p></div>
              <div class="nh-meta-block"><p class="nh-meta-label">Words</p><p class="nh-meta-value">${formatCompactNumber(detail.wordCount)}</p></div>
              <div class="nh-meta-block"><p class="nh-meta-label">Readers</p><p class="nh-meta-value">${formatCompactNumber(detail.readingCount)}</p></div>
              <div class="nh-meta-block"><p class="nh-meta-label">Shelf adds</p><p class="nh-meta-value">${formatCompactNumber(detail.bookshelfCount)}</p></div>
              ${detail.ratingScore !== undefined ? `<div class="nh-meta-block"><p class="nh-meta-label">Rating</p><p class="nh-meta-value">${escapeHtml(detail.ratingScore.toFixed(1))}</p></div>` : ""}
              ${detail.favoriteCount !== undefined ? `<div class="nh-meta-block"><p class="nh-meta-label">Favorites</p><p class="nh-meta-value">${formatCompactNumber(detail.favoriteCount)}</p></div>` : ""}
            </div>
          </section>
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Title signals",
              title: "A detail page should explain reputation, release rhythm, and access terms clearly.",
              copy: "These cues make the title feel like part of a real storefront instead of a single content object.",
            })}
            <div class="nh-detail-action-grid">
              <article class="nh-panel">
                <p class="nh-meta-label">Reader reputation</p>
                <h3 class="nh-item-title">${detail.ratingScore !== undefined ? `${detail.ratingScore.toFixed(1)} / 5.0` : "Editorial feature"}</h3>
                <p class="nh-item-copy">${escapeHtml(state.reputationSummary ?? (detail.ratingCount !== undefined ? `${formatCompactNumber(detail.ratingCount)} reader ratings with ${formatCompactNumber(detail.favoriteCount)} favorites on file.` : "Rating and favorite signals can be surfaced here once the title begins collecting reader sentiment."))}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Update cadence</p>
                <h3 class="nh-item-title">${escapeHtml(detail.updateCadenceLabel ?? "Release pattern pending")}</h3>
                <p class="nh-item-copy">${escapeHtml(state.cadenceSummary ?? detail.updateHistoryLabel ?? "A title dossier should tell the reader when this story tends to move, not just what the latest chapter is called.")}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Trial rule</p>
                <h3 class="nh-item-title">${escapeHtml(detail.trialRuleLabel ?? "Access rules update here once trial and premium logic diverge.")}</h3>
                <p class="nh-item-copy">${escapeHtml(state.trialSummary ?? detail.accessRuleSummaryLabel ?? "This keeps access expectations explicit before the reader opens or the membership flow starts.")}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Author presence</p>
                <h3 class="nh-item-title">${escapeHtml(detail.author.name)}</h3>
                <p class="nh-item-copy">${escapeHtml(detail.authorPresenceLabel ?? detail.author.bio ?? "Author voice, catalog trust, and title posture should all be legible before the first chapter opens.")}</p>
              </article>
            </div>
          </section>
          ${
            state.latestMilestoneTitle
              ? `
                <section class="nh-card">
                  ${renderSectionHeading({
                    kicker: "Latest milestone",
                    title: state.latestMilestoneTitle,
                    copy: state.latestMilestoneCopy ?? "The detail page should know the latest completed reading milestone, not only the next chapter to resume.",
                  })}
                  <div class="nh-chip-row">
                    ${state.latestMilestoneSourceLabel ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneSourceLabel)}</span>` : ""}
                    ${state.latestMilestoneRecencyLabel ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneRecencyLabel)}</span>` : ""}
                    ${state.latestMilestoneMeta ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneMeta)}</span>` : ""}
                  </div>
                  ${
                    state.latestMilestoneReturnHint
                      ? `<p class="nh-copy">${escapeHtml(state.latestMilestoneReturnHint)}</p>`
                      : ""
                  }
                  <div class="nh-actions">
                    ${renderActionButton(state.latestMilestoneReturnLabel ?? "Resume milestone", "controller", "openLatestMilestone", undefined, "primary")}
                  </div>
                </section>
              `
              : ""
          }
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Reading actions",
              title: "Support entry from first read, continue read, and directory browse.",
              copy: "A real detail page should be both a merch page and a control surface.",
            })}
            <div class="nh-detail-action-grid">
              <article class="nh-panel">
                <p class="nh-meta-label">Continue</p>
                <h3 class="nh-item-title">Resume the active session.</h3>
                <p class="nh-item-copy">Jump back to ${escapeHtml(detail.continueChapterId ?? detail.firstChapterId ?? "the opening chapter")} without re-scanning the directory.</p>
                <div class="nh-actions">
                  ${renderActionButton(state.primaryActionLabel ?? "Continue", "controller", "continueReading", undefined, "primary")}
                </div>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Directory</p>
                <h3 class="nh-item-title">Inspect the release structure.</h3>
                <p class="nh-item-copy">Volumes, membership labels, and the last-read chapter should remain visible before reading.</p>
                <div class="nh-actions">
                  ${renderActionButton("Open TOC", "controller", "goToToc", undefined, "secondary")}
                </div>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Bookshelf</p>
                <h3 class="nh-item-title">${detail.inBookshelf ? "Already on the active shelf." : "Pin this title for faster return."}</h3>
                <p class="nh-item-copy">
                  ${escapeHtml(
                    state.bookshelfSummary ??
                      (detail.inBookshelf
                        ? "The shelf route can now resume this title directly from its saved chapter."
                        : "Adding from detail turns the page into a real collection action instead of a passive storefront."),
                  )}
                </p>
                <div class="nh-actions">
                  ${
                    detail.inBookshelf
                      ? renderActionButton(state.bookshelfBusy ? "Removing..." : "Remove from shelf", "controller", "removeFromBookshelf", undefined, "secondary")
                      : renderActionButton(state.bookshelfBusy ? "Adding..." : "Add to shelf", "controller", "addToBookshelf", undefined, "secondary")
                  }
                </div>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Latest chapter</p>
                <h3 class="nh-item-title">${escapeHtml(detail.latestChapter?.title ?? "New release pending")}</h3>
                <p class="nh-item-copy">${escapeHtml(detail.updateHistoryLabel ?? `Updated ${formatDate(detail.latestChapter?.updatedAt)} · ${detail.updateCadenceLabel ?? "keeps the detail page feeling alive."}`)}</p>
                <div class="nh-actions">
                  ${state.membershipLocked ? renderActionButton(state.membershipActionLabel ?? "Open membership", "controller", "goToMembership", undefined, "ghost") : renderRouteLink("Back to library", routePath("catalog"), "ghost")}
                </div>
              </article>
            </div>
          </section>
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Related reads",
              title: "Recommendation density keeps the detail page alive after the first decision.",
              copy: escapeHtml(detail.relatedLaneLabel ?? "A strong detail page should recommend adjacent titles without collapsing into a generic carousel."),
            })}
            <div class="nh-section-grid">
              ${(detail.relatedNovels ?? [])
                .map(
                  (item) => `
                    <article class="nh-item">
                      <div class="nh-chip-row">
                        <span class="nh-chip">${escapeHtml(item.categoryLabel)}</span>
                        <span class="nh-chip">${escapeHtml(item.status)}</span>
                        ${item.requiresMembership ? '<span class="nh-chip">Membership</span>' : '<span class="nh-chip">Open</span>'}
                      </div>
                      <h3 class="nh-item-title">${escapeHtml(item.title)}</h3>
                      <p class="nh-item-subtitle">${escapeHtml(item.authorName)}</p>
                      <p class="nh-item-copy">${escapeHtml(item.highlight)}</p>
                      <div class="nh-actions">
                        ${renderActionButton("Open detail", "controller", "goToRelatedNovel", item.id, "ghost")}
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        </div>
        <aside class="nh-grid nh-sticky-rail">
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Author note",
              title: detail.author.name,
              copy: detail.authorPresenceLabel ?? detail.author.bio ?? "Author biography placeholder.",
              compact: true,
            })}
            <div class="nh-grid">
              <article class="nh-panel">
                <p class="nh-meta-label">Author profile</p>
                <p class="nh-item-copy">${escapeHtml(detail.author.bio ?? "The author rail should make the title feel like part of a catalog, not a standalone mock object.")}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Why this title</p>
                <p class="nh-item-copy">
                  ${escapeHtml(
                    detail.requiresMembership
                      ? "Premium positioning, update cadence, and continuation need to feel deliberate before the paywall ever appears."
                      : "Open-access titles still need a strong editorial frame so they feel curated rather than merely available.",
                  )}
                </p>
              </article>
            </div>
          </section>
          <section class="nh-card">
            ${renderSectionHeading({
              kicker: "Release profile",
              title: "Access and release cues should sit in a narrow rail.",
              compact: true,
            })}
            <div class="nh-grid">
              <article class="nh-panel">
                <p class="nh-meta-label">Status</p>
                <p class="nh-meta"><strong>${escapeHtml(detail.status)}</strong></p>
                <p class="nh-item-copy">${escapeHtml(detail.accessRuleSummaryLabel ?? detail.trialRuleLabel ?? (detail.requiresMembership ? "Premium continuation after the trial boundary." : "Open title with standard chapter flow."))}</p>
              </article>
              <article class="nh-panel">
                <p class="nh-meta-label">Current route</p>
                <p class="nh-meta"><strong>${escapeHtml(detail.latestChapter?.title ?? "Fresh release pending")}</strong></p>
                <p class="nh-item-copy">${escapeHtml(detail.updateHistoryLabel ?? `Latest update · ${formatDate(detail.latestChapter?.updatedAt)}`)}</p>
              </article>
            </div>
          </section>
        </aside>
      </section>
    `,
  );
}

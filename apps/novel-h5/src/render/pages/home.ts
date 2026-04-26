import type { CatalogState } from "@minix/feature-catalog";

import type { NovelH5PageRenderContext } from "../types";
import { renderChipRow } from "../components/chip-row";
import { renderNovelCard } from "../components/novel-card";
import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatCompactNumber, formatDate, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderHomePage(context: NovelH5PageRenderContext, state: CatalogState): string {
  const featured = state.items.find((item) => item.id === state.selectedNovelId) ?? state.items[0];
  const serials = state.items.filter((item) => item.status === "serializing");
  const completed = state.items.filter((item) => item.status === "completed");
  const continueLane = [...state.items.filter((item) => item.continueChapterId)].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const resumeNovel = continueLane[0];
  const ranked = [...state.items].sort((left, right) => (right.readingCount ?? 0) - (left.readingCount ?? 0)).slice(0, 3);
  const visibleCards = state.items.slice(0, 3);
  const membershipTitles = state.items.filter((item) => item.requiresMembership);
  const recentlyUpdated = [...state.items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3);
  const heroStats = [
    { label: "Frontlist", value: String(state.items.length).padStart(2, "0"), note: "Editorially staged titles" },
    { label: "Serials", value: String(serials.length).padStart(2, "0"), note: "Ongoing weekly updates" },
    { label: "Resume ready", value: String(continueLane.length).padStart(2, "0"), note: "Titles with saved progress" },
    { label: "Average words", value: `${Math.round(state.items.reduce((total, item) => total + item.wordCount, 0) / Math.max(state.items.length, 1) / 1000)}k`, note: "Long-form reading depth" },
  ];
  const featuredPrimaryLabel = featured?.continueChapterId ? "Continue reading" : "Read now";
  const featuredPrimaryAction = featured?.continueChapterId ? "continueReading" : "goToNovelDetail";
  const featuredPrimaryCopy = featured?.recommendedReason ?? featured?.continueChapterTitle ?? featured?.latestChapterTitle ?? "Fresh chapters landing soon";

  const featuredPanel = featured
    ? `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Editorial frontlist</div>
          <h1 class="nh-title">${escapeHtml(featured.title)}</h1>
          <p class="nh-copy">${escapeHtml(featured.summary)}</p>
          ${renderChipRow([featured.categoryLabel, featured.status, featured.requiresMembership ? "Membership" : "Free entry"])}
          <div class="nh-stat-strip">
            ${renderStatPanels(heroStats)}
          </div>
          <div class="nh-actions">
            ${renderActionButton(featuredPrimaryLabel, "controller", featuredPrimaryAction, featured.id, "primary")}
            ${renderRouteLink("Browse all books", routePath("catalog"), "button")}
            ${renderRouteLink("Editorial discover", routePath("feed"), "ghost")}
            ${renderRouteLink("Open shelf", routePath("bookshelf"), "ghost")}
          </div>
          ${
            resumeNovel
              ? `
                <div class="nh-promo-band">
                  <div>
                    <p class="nh-meta-label">Continue reading</p>
                    <p class="nh-copy">
                      ${escapeHtml(state.continueReason ?? `Return to ${resumeNovel.title} at ${resumeNovel.continueChapterTitle ?? resumeNovel.latestChapterTitle ?? "your saved chapter"}.`)}
                    </p>
                  </div>
                  <div class="nh-actions">
                    ${renderActionButton("Resume now", "controller", "continueReading", resumeNovel.id, "primary")}
                    ${renderActionButton("Open shelf", "controller", "goToBookshelf", undefined, "ghost")}
                  </div>
                </div>
              `
              : ""
          }
          <div class="nh-promo-band">
            <div>
              <p class="nh-meta-label">What changed</p>
              <p class="nh-copy">${escapeHtml(state.storefrontReason ?? "The homepage now works as a storefront with personal momentum: discovery first, but continuation never buried.")}</p>
            </div>
            ${renderRouteLink("Membership", routePath("membership"), "ghost")}
          </div>
        </div>
        <div class="nh-grid">
          <aside class="nh-cover">
            <p class="nh-cover-kicker">${escapeHtml(resumeNovel ? "Resume spotlight" : "Featured this week")}</p>
            <h2 class="nh-cover-title">${escapeHtml(resumeNovel?.title ?? featured.title)}</h2>
            <p class="nh-cover-copy">
              ${escapeHtml(resumeNovel?.authorName ?? featured.authorName)} · ${escapeHtml(resumeNovel?.continueChapterTitle ?? featuredPrimaryCopy)}
            </p>
          </aside>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Issue No. 03</p>
            <h3 class="nh-item-title">${escapeHtml(resumeNovel ? "Your active reading loop is now part of the front page." : "Quiet luxury for serialized reading.")}</h3>
            <p class="nh-item-copy">
              ${
                resumeNovel
                  ? "The landing surface should know what to resume before asking the reader to browse again. Continue reading now sits next to discovery instead of hiding behind another route."
                  : "The shell is now designed to feel like a frontlist editorial page instead of a runtime inspector. Hero inventory, update cadence, and membership cues all sit in the same information rhythm."
              }
            </p>
            <div class="nh-item-metadata">
              <span>${escapeHtml(formatDate((resumeNovel ?? featured).updatedAt))}</span>
              <span>${formatCompactNumber((resumeNovel ?? featured).readingCount)} active readers</span>
            </div>
          </article>
        </div>
      </section>
    `
    : "";

  return renderAppShell(
    "home",
    `
      ${featuredPanel}
      <section class="nh-sidebar-grid">
        <div class="nh-card">
          ${renderSectionHeading({
            kicker: "Reading profile",
            title: "The front page should know what kind of reader is arriving.",
            copy: "Use shelf momentum, resume state, and category drift to make the storefront feel personal before the user taps a title.",
          })}
          <div class="nh-stat-strip">
            ${renderStatPanels([
              {
                label: "Primary lane",
                value: resumeNovel?.categoryLabel ?? featured?.categoryLabel ?? "Frontlist",
                note: resumeNovel ? "Derived from the current resume title." : "Derived from the editorial lead title.",
              },
              {
                label: "Session mode",
                value: resumeNovel ? "Resume-first" : "Browse-first",
                note: resumeNovel
                  ? "A saved chapter exists, so the homepage prioritizes fast re-entry."
                  : "No saved chapter is active, so discovery leads the route.",
              },
              {
                label: "Commercial mix",
                value: `${membershipTitles.length}/${state.items.length}`,
                note: "Membership titles kept visible without collapsing the page into a paywall.",
              },
            ])}
          </div>
        </div>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Editor's desk",
            title: "Recommendation lanes should explain why discovery is arranged this way.",
            copy: "These notes make the storefront read like programming, not a silent card dump.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Because you read...</p>
              <p class="nh-item-copy">${escapeHtml(state.continueReason ?? (resumeNovel ? `${resumeNovel.title} keeps the strongest return signal, so it stays above fresh discovery.` : "No active trail is pinned yet, so the lead slot stays editorial."))}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Recently updated on your shelf</p>
              <p class="nh-item-copy">${escapeHtml(state.updateReason ?? serials[0]?.latestChapterTitle ?? "Serial update cadence becomes visible here once active titles start landing weekly.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Frontlist note</p>
              <p class="nh-item-copy">${escapeHtml(state.frontlistReason ?? "The discovery lane should explain why one title anchors the storefront right now.")}</p>
            </article>
          </div>
        </aside>
      </section>
      ${
        state.latestMilestoneTitle
          ? `
            <section class="nh-card">
              ${renderSectionHeading({
                kicker: "Latest milestone",
                title: state.latestMilestoneTitle,
                copy: state.latestMilestoneCopy ?? "The storefront should remember the latest completed reading milestone, not only the next unfinished return.",
              })}
              ${renderChipRow([
                state.latestMilestoneSourceLabel,
                state.latestMilestoneRecencyLabel,
                state.latestMilestoneMeta,
              ])}
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
      ${
        state.milestoneHistory.length > 0
          ? `
            <section class="nh-card">
              ${renderSectionHeading({
                kicker: "Milestone history",
                title: "Recent reading milestones should show progression, not only the latest save.",
                copy: "This lane keeps the storefront aware of the last few meaningful reading completions across reader, TOC, and shelf.",
              })}
              <div class="nh-section-grid">
                ${state.milestoneHistory
                  .slice(0, 3)
                  .map(
                    (item, index) => `
                      <article class="nh-item">
                        <div class="nh-kicker">${escapeHtml(item.typeLabel)}</div>
                        <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                        <p class="nh-item-copy">${escapeHtml(item.copy)}</p>
                        ${renderChipRow([item.sourceLabel, item.recencyLabel, item.meta])}
                        <p class="nh-item-copy">${escapeHtml(item.returnHint)}</p>
                        <div class="nh-actions">
                          ${renderActionButton(item.returnLabel, "controller", "openMilestoneHistoryItem", index, "ghost")}
                        </div>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
      <section class="nh-card">
        ${renderSectionHeading({
          kicker: "Continue lane",
          title: "Readers coming back should see their active books before they browse again.",
          copy: escapeHtml(state.continueReason ?? "This makes the homepage feel personal without turning it into a utilitarian dashboard."),
          aside: renderRouteLink("Open shelf", routePath("bookshelf"), "ghost"),
        })}
        <div class="nh-section-grid">
          ${continueLane.length > 0
            ? continueLane
                .slice(0, 3)
                .map((item) =>
                  renderNovelCard(item, {
                    active: state.selectedNovelId === item.id,
                    primary: { label: "Resume", action: "continueReading", value: item.id, variant: "primary" },
                    secondary: { label: "Focus", action: "selectNovel", value: item.id, variant: "ghost" },
                    highlight: item.recommendedReason ?? item.continueChapterTitle ?? "Saved reading position",
                  }),
                )
                .join("")
            : `<div class="nh-empty-state"><p class="nh-copy">Once reading progress exists, this lane should surface the next best return point immediately.</p></div>`}
        </div>
      </section>
      <section class="nh-card">
        ${renderSectionHeading({
          kicker: "Frontlist selection",
          title: "Curated stories for a real novel storefront.",
          copy: escapeHtml(state.frontlistReason ?? "Each card needs to feel shoppable, readable, and commercially legible at a glance."),
          aside: renderRouteLink("Open full catalog", routePath("catalog"), "ghost"),
        })}
        <div class="nh-section-grid">
          ${visibleCards
            .map((item) =>
              renderNovelCard(item, {
                active: state.selectedNovelId === item.id,
                primary: { label: "Focus", action: "selectNovel", value: item.id, variant: "secondary" },
                secondary: {
                  label: item.continueChapterId ? "Continue" : "Open",
                  action: item.continueChapterId ? "continueReading" : "goToNovelDetail",
                  value: item.id,
                  variant: "ghost",
                },
                highlight: item.recommendedReason ?? item.continueChapterTitle ?? (item.status === "serializing" ? "Serial momentum" : "Backlist stability"),
              }),
            )
            .join("")}
        </div>
      </section>
      <section class="nh-sidebar-grid">
        <div class="nh-card">
          ${renderSectionHeading({
            kicker: "Serial updates",
            title: "Readers should feel the cadence of ongoing publication.",
            copy: state.serialReason ?? "This block makes the release rhythm visible before the user ever enters the reader.",
          })}
          <div class="nh-grid">
            ${serials
              .map((item) =>
                renderNovelCard(item, {
                  variant: "compact",
                  primary: {
                    label: item.continueChapterId ? "Continue" : "Read",
                    action: item.continueChapterId ? "continueReading" : "goToNovelDetail",
                    value: item.id,
                    variant: "primary",
                  },
                  secondary: { label: "Focus", action: "selectNovel", value: item.id, variant: "ghost" },
                  highlight: item.recommendedReason ?? item.continueChapterTitle ?? item.latestChapterTitle ?? "New chapter pending",
                }),
              )
              .join("")}
          </div>
        </div>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Popularity table",
            title: "A storefront needs a visible ranking language.",
            copy: state.rankingReason ?? "Top lines become quick decisions for users who enter from campaigns or direct links.",
          })}
          <div class="nh-ranking-list">
            ${ranked
              .map(
                (item, index) => `
                  <article class="nh-ranking-item">
                    <div class="nh-ranking-order">0${index + 1}</div>
                    <div class="nh-grid">
                      <p class="nh-meta"><strong>${escapeHtml(item.title)}</strong></p>
                      <p class="nh-item-copy">${escapeHtml(item.latestChapterTitle ?? "Fresh landing page entry")}</p>
                    </div>
                    <div class="nh-ranking-meta">
                      <span>${formatCompactNumber(item.readingCount)}</span>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <div class="nh-card">
          ${renderSectionHeading({
            kicker: "Recently updated on your shelf",
            title: "Recent movement should be merchandised, not buried in metadata.",
            copy: escapeHtml(state.updateReason ?? "This block acts like a compact editorial watchlist for returning readers."),
          })}
          <div class="nh-grid">
            ${recentlyUpdated
              .map((item) =>
                renderNovelCard(item, {
                  variant: "compact",
                  primary: {
                    label: item.continueChapterId ? "Resume" : "Open",
                    action: item.continueChapterId ? "continueReading" : "goToNovelDetail",
                    value: item.id,
                    variant: "primary",
                  },
                  secondary: { label: "Focus", action: "selectNovel", value: item.id, variant: "ghost" },
                  highlight: item.recommendedReason ?? item.latestChapterTitle ?? "Fresh update on the lane",
                }),
              )
              .join("")}
          </div>
        </div>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Membership radar",
            title: "Premium titles need their own quiet merchandising lane.",
            copy: escapeHtml(state.membershipReason ?? "Keep the offer visible without breaking the editorial rhythm of the homepage."),
            compact: true,
          })}
          <div class="nh-grid">
            ${membershipTitles.slice(0, 2).map((item) => `
              <article class="nh-panel">
                <p class="nh-meta-label">${escapeHtml(item.title)}</p>
                <p class="nh-item-copy">${escapeHtml(item.recommendedReason ?? state.membershipReason ?? item.summary)}</p>
                <div class="nh-actions">
                  ${renderActionButton("Open detail", "controller", "goToNovelDetail", item.id, "secondary")}
                </div>
              </article>
            `).join("")}
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <div class="nh-card">
          ${renderSectionHeading({
            kicker: "Backlist and membership",
            title: "Premium and completed inventory should feel equally deliberate.",
            copy: "This keeps commercial logic visible without turning the page into a loud paywall.",
          })}
          <div class="nh-section-grid">
            ${[...completed, ...membershipTitles]
              .slice(0, 3)
              .map((item) =>
                renderNovelCard(item, {
                  variant: "compact",
                  primary: {
                    label: item.continueChapterId && !item.requiresMembership ? "Continue" : item.requiresMembership ? "Unlock" : "Open",
                    action: item.continueChapterId && !item.requiresMembership ? "continueReading" : "goToNovelDetail",
                    value: item.id,
                    variant: "primary",
                  },
                  secondary: { label: "Focus", action: "selectNovel", value: item.id, variant: "ghost" },
                  highlight: item.recommendedReason ?? item.continueChapterTitle ?? (item.requiresMembership ? "Premium shelf" : "Completed run"),
                }),
              )
              .join("")}
          </div>
        </div>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Browse by lane",
            title: "Genre lanes should be one tap away from the hero.",
            copy: "These map directly to catalog filtering so the homepage feels operational, not decorative.",
          })}
          <div class="nh-grid">
            ${state.categories
              .filter((category) => category.key !== "all")
              .map(
                (category) => `
                  <article class="nh-lane-card">
                    <div class="nh-grid">
                      <p class="nh-meta"><strong>${escapeHtml(category.label)}</strong></p>
                      <p class="nh-item-copy">Jump into the ${escapeHtml(category.label.toLowerCase())} lane with the catalog already narrowed.</p>
                    </div>
                    <div class="nh-actions">
                      ${renderActionButton("Open lane", "controller", "applyCategory", category.key, "secondary")}
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </aside>
      </section>
    `,
  );
}

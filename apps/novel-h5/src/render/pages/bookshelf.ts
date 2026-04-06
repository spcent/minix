import type { BookshelfState } from "@minix/feature-bookshelf";

import type { NovelH5PageRenderContext } from "../types";
import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatDate, renderActionButton } from "../utils";

function isCompleted(progressPercent?: number): boolean {
  return (progressPercent ?? 0) >= 0.99;
}

export function renderBookshelfPage(context: NovelH5PageRenderContext, state: BookshelfState): string {
  const visibleItems = state.visibleItems;
  const selected = visibleItems.find((item) => item.novelId === state.selectedNovelId) ?? visibleItems[0];
  const pinnedItem = state.pinnedItem;
  const updates = state.updateItems;
  const completedItems = state.completedItems;
  const activeReading = state.activeItems.slice(0, 3);
  const averageProgress =
    state.items.length > 0
      ? Math.round((state.items.reduce((sum, item) => sum + (item.progressPercent ?? 0), 0) / state.items.length) * 100)
      : 0;
  const filterEmptyText =
    state.activeFilterKey === "updates"
      ? "No shelf titles have unread updates right now."
      : state.activeFilterKey === "completed"
        ? "No completed titles are on the current shelf yet."
        : state.errorText ?? state.emptyText;
  const resumeCueTitle = state.resumeCueTitle ?? selected?.title ?? "Your next reading return";
  const resumeCueReason =
    state.resumeCueReason ??
    (selected?.continueChapterTitle
      ? `Because you paused at ${selected.continueChapterTitle}, this title stays surfaced as the fastest way back into flow.`
      : "The shelf should explain why one title is surfaced as the fastest return path.");
  const resumeCueMeta =
    state.resumeCueMeta ??
    (selected ? `${selected.authorName} · ${selected.continueChapterTitle ?? selected.latestChapterTitle ?? "Ready to reopen"}` : "No active title is surfaced yet.");
  const backlogCueTitle = state.backlogCueTitle ?? completedItems[0]?.title ?? "No backlog title yet";
  const backlogCueReason = state.backlogCueReason ?? "Finished titles should become quiet re-entry candidates once the active run is complete.";

  return renderAppShell(
    "bookshelf",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Bookshelf</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">The shelf should feel like a calm command center: what to resume, what updated, and what deserves another session right now.</p>
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Active titles</p>
              <p class="nh-stat-value">${String(state.activeCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Still moving through active reading</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">With updates</p>
              <p class="nh-stat-value">${String(state.updatedCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Need attention now</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Average progress</p>
              <p class="nh-stat-value">${averageProgress}%</p>
              <p class="nh-item-copy">Across the active stack</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Completed</p>
              <p class="nh-stat-value">${String(state.completedCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Finished and ready to revisit</p>
            </article>
          </div>
          ${state.statusText ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.statusText)}</p></div>` : ""}
          <div class="nh-actions">
            ${renderActionButton("Continue reading", "controller", "continueSelectedNovel", undefined, "primary")}
            ${renderActionButton("Open detail", "controller", "openSelectedNovel", undefined, "ghost")}
            ${selected && state.pinnedNovelId !== selected.novelId ? renderActionButton("Pin to top", "controller", "pinNovel", selected.novelId, "ghost") : ""}
            ${state.pinnedNovelId ? renderActionButton("Clear pin", "controller", "clearPinnedNovel", undefined, "ghost") : ""}
            ${selected ? renderActionButton(state.mutatingNovelId === selected.novelId ? "Removing..." : "Remove from shelf", "controller", "removeNovel", selected.novelId, "ghost") : ""}
            ${renderActionButton("Preferences", "controller", "goToSettings", undefined, "ghost")}
          </div>
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Current focus</p>
            <h2 class="nh-cover-title">${escapeHtml(resumeCueTitle)}</h2>
            <p class="nh-cover-copy">${escapeHtml(resumeCueMeta)}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Because you paused here</p>
            <p class="nh-item-copy">${escapeHtml(resumeCueReason)}</p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Continue reading",
            title: "One selected title anchors the next session.",
            copy: "Sort and filter the shelf without losing the dominant return path.",
          })}
          <div class="nh-actions">
            ${renderActionButton("All titles", "controller", "setFilter", "all", state.activeFilterKey === "all" ? "secondary" : "ghost")}
            ${renderActionButton("Updated", "controller", "setFilter", "updates", state.activeFilterKey === "updates" ? "secondary" : "ghost")}
            ${renderActionButton("Completed", "controller", "setFilter", "completed", state.activeFilterKey === "completed" ? "secondary" : "ghost")}
          </div>
          <div class="nh-actions">
            ${renderActionButton("Recent first", "controller", "setSort", "recent", state.activeSortKey === "recent" ? "secondary" : "ghost")}
            ${renderActionButton("Updated first", "controller", "setSort", "updated", state.activeSortKey === "updated" ? "secondary" : "ghost")}
            ${renderActionButton("Most progress", "controller", "setSort", "progress", state.activeSortKey === "progress" ? "secondary" : "ghost")}
          </div>
          ${
            pinnedItem
              ? `
                <article class="nh-panel">
                  <p class="nh-meta-label">Pinned lane</p>
                  <h2 class="nh-title-small">${escapeHtml(pinnedItem.title)}</h2>
                  <p class="nh-item-copy">${escapeHtml(pinnedItem.continueChapterTitle ?? pinnedItem.latestChapterTitle ?? "Saved continuation available")} · because you pinned it above the rest of the shelf lane.</p>
                  <div class="nh-actions">
                    ${renderActionButton("Continue", "controller", "continueNovel", pinnedItem.novelId, "primary")}
                    ${renderActionButton("Clear pin", "controller", "clearPinnedNovel", undefined, "ghost")}
                  </div>
                </article>
              `
              : ""
          }
          ${
            selected
              ? `
                <article class="nh-spotlight-card">
                  <div class="nh-grid">
                    <div class="nh-chip-row">
                      ${state.pinnedNovelId === selected.novelId ? '<span class="nh-chip">Pinned</span>' : ""}
                      ${selected.hasUpdate ? '<span class="nh-chip">Updated</span>' : '<span class="nh-chip">Stable</span>'}
                      ${selected.progressPercent !== undefined ? `<span class="nh-chip">${Math.round(selected.progressPercent * 100)}% read</span>` : ""}
                    </div>
                    <h2 class="nh-title-small">${escapeHtml(selected.title)}</h2>
                    <p class="nh-item-subtitle">${escapeHtml(selected.authorName)}</p>
                    <p class="nh-copy">
                      Continue at ${escapeHtml(selected.continueChapterTitle ?? selected.latestChapterTitle ?? "the latest chapter")} · updated ${escapeHtml(formatDate(selected.updatedAt))}
                    </p>
                    <p class="nh-item-copy">${escapeHtml(resumeCueReason)}</p>
                    <p class="nh-item-copy">Visible set: ${escapeHtml(state.activeFilterKey)} filter · ${escapeHtml(state.activeSortKey)} sort</p>
                    <div class="nh-actions">
                      ${renderActionButton("Resume", "controller", "continueSelectedNovel", undefined, "primary")}
                      ${state.pinnedNovelId === selected.novelId ? renderActionButton("Clear pin", "controller", "clearPinnedNovel", undefined, "ghost") : renderActionButton("Pin to top", "controller", "pinNovel", selected.novelId, "ghost")}
                      ${renderActionButton("Open detail", "controller", "openSelectedNovel", undefined, "ghost")}
                      ${renderActionButton(state.mutatingNovelId === selected.novelId ? "Removing..." : "Remove from shelf", "controller", "removeNovel", selected.novelId, "ghost")}
                    </div>
                  </div>
                </article>
              `
              : `<div class="nh-empty-state"><p class="nh-copy">${escapeHtml(filterEmptyText)}</p></div>`
          }
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Update queue",
            title: "Recent movement should be visible at a glance.",
            copy: "This keeps the shelf feeling alive, especially when serial titles update asynchronously.",
          })}
          <div class="nh-grid">
            <p class="nh-item-copy">${escapeHtml(state.updateLaneReason ?? "Update movement should stay visible at a glance.")}</p>
            ${
              updates.length > 0
                ? updates
                    .map(
                      (item) => `
                        <article class="nh-ranking-item">
                          <div class="nh-ranking-order">UP</div>
                          <div class="nh-grid">
                            <p class="nh-meta"><strong>${escapeHtml(item.title)}</strong></p>
                            <p class="nh-item-copy">${escapeHtml(item.latestChapterTitle ?? "New chapter available")}</p>
                          </div>
                          <div class="nh-ranking-meta">${escapeHtml(formatDate(item.updatedAt))}</div>
                        </article>
                      `,
                    )
                    .join("")
                : '<p class="nh-copy">No new updates right now.</p>'
            }
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Shelf programming",
            title: "A strong shelf should tell the reader what kind of return session is available.",
            copy: "These lanes turn the shelf into a reading workspace instead of a static collection dump.",
          })}
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Resume-first</p>
              <p class="nh-stat-value">${String(state.activeCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Titles still in active progress</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Update watch</p>
              <p class="nh-stat-value">${String(state.updatedCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Stories with fresh chapter movement</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Archive</p>
              <p class="nh-stat-value">${String(state.completedCount).padStart(2, "0")}</p>
              <p class="nh-item-copy">Finished runs ready for re-entry</p>
            </article>
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Curator note",
            title: "Selection should feel editorial, not accidental.",
            copy: "The active shelf view should explain why one title is being surfaced as the next session.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Why this title</p>
              <p class="nh-item-copy">${escapeHtml(state.selectionReason ?? "No title is currently surfaced in this shelf view.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Because you paused here</p>
              <p class="nh-item-copy">${escapeHtml(resumeCueReason)}</p>
            </article>
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Active reading program",
            title: "Keep active and backlog lanes clearly separated.",
            copy: "A real reading workspace should distinguish current momentum from archive re-entry.",
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Current run</p>
              <p class="nh-item-copy">${escapeHtml(state.activeLaneReason ?? "Active titles should remain warm between sessions.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Backlog lane</p>
              <p class="nh-item-copy">${escapeHtml(backlogCueReason)}</p>
              ${state.backlogQueueLabel ? `<p class="nh-item-copy">${escapeHtml(state.backlogQueueLabel)}</p>` : ""}
            </article>
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Backlog re-entry",
            title: backlogCueTitle,
            copy: backlogCueReason,
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Why now</p>
              <p class="nh-item-copy">${escapeHtml(backlogCueReason)}</p>
              ${state.backlogQueueLabel ? `<p class="nh-item-copy">${escapeHtml(state.backlogQueueLabel)}</p>` : ""}
            </article>
          </div>
        </aside>
      </section>
      <section class="nh-card">
        ${renderSectionHeading({
          kicker: "Reading milestone",
          title: state.programMilestoneTitle ?? "No archive milestone yet",
          copy: state.programMilestoneCopy ?? "Finished titles should eventually accumulate into stable milestones instead of disappearing behind active continuation cues.",
        })}
        ${
          state.programMilestoneMeta
            ? `<div class="nh-chip-row"><span class="nh-chip">${escapeHtml(state.programMilestoneMeta)}</span></div>`
            : ""
        }
      </section>
      ${
        state.milestoneHistory.length > 0
          ? `
            <section class="nh-card">
              ${renderSectionHeading({
                kicker: "Milestone history",
                title: "The shelf should remember the last few milestones as a progression trail.",
                copy: "This keeps the reading console aware of recent completions and re-entry points instead of only the current archive headline.",
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
                        <div class="nh-chip-row">
                          <span class="nh-chip">${escapeHtml(item.sourceLabel)}</span>
                          ${item.recencyLabel ? `<span class="nh-chip">${escapeHtml(item.recencyLabel)}</span>` : ""}
                          ${item.meta ? `<span class="nh-chip">${escapeHtml(item.meta)}</span>` : ""}
                        </div>
                        <p class="nh-item-copy">${escapeHtml(item.returnHint)}</p>
                        ${
                          item.source === "bookshelf"
                            ? ""
                            : `<div class="nh-actions">${renderActionButton(item.returnLabel, "controller", "openMilestoneHistoryItem", index, "ghost")}</div>`
                        }
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
          kicker: "Shelf inventory",
          title: "Every saved title still needs momentum and hierarchy.",
          copy: "Cards now reflect the active shelf view instead of forcing one fixed order.",
        })}
        <div class="nh-section-grid">
          ${visibleItems.length > 0
            ? visibleItems
                .map(
                  (item) => `
                    <article class="nh-item nh-item-activeable${state.selectedNovelId === item.novelId ? " nh-item-active" : ""}">
                      <div class="nh-chip-row">
                        ${state.pinnedNovelId === item.novelId ? '<span class="nh-chip">Pinned</span>' : ""}
                        ${item.hasUpdate ? '<span class="nh-chip">Updated</span>' : ""}
                        ${item.progressPercent !== undefined ? `<span class="nh-chip">${Math.round(item.progressPercent * 100)}% read</span>` : ""}
                        ${isCompleted(item.progressPercent) ? '<span class="nh-chip">Completed</span>' : ""}
                      </div>
                      <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                      <p class="nh-item-subtitle">${escapeHtml(item.authorName)}</p>
                      <p class="nh-item-copy">Continue at ${escapeHtml(item.continueChapterTitle ?? item.latestChapterTitle ?? "the latest chapter")} · ${escapeHtml(formatDate(item.updatedAt))}</p>
                      <div class="nh-actions">
                        ${renderActionButton("Focus", "controller", "selectNovel", item.novelId)}
                        ${state.pinnedNovelId === item.novelId ? renderActionButton("Clear pin", "controller", "clearPinnedNovel", undefined, "ghost") : renderActionButton("Pin", "controller", "pinNovel", item.novelId, "ghost")}
                        ${renderActionButton("Continue", "controller", "continueNovel", item.novelId, "primary")}
                        ${renderActionButton("Detail", "controller", "openNovel", item.novelId, "ghost")}
                        ${renderActionButton(state.mutatingNovelId === item.novelId ? "Removing..." : "Remove", "controller", "removeNovel", item.novelId, "ghost")}
                      </div>
                    </article>
                  `,
                )
                .join("")
            : `<div class="nh-empty-state"><p class="nh-copy">${escapeHtml(filterEmptyText)}</p></div>`}
        </div>
      </section>
      <section class="nh-sidebar-grid">
        <div class="nh-card">
          ${renderSectionHeading({
            kicker: "Active stack",
            title: "These are the titles still moving through the current reading rhythm.",
            copy: "Use this lane to keep partially read stories warm between sessions.",
          })}
          <div class="nh-grid">
            <p class="nh-item-copy">${escapeHtml(state.activeLaneReason ?? "Active titles should stay warm between reading sessions.")}</p>
            ${activeReading.length > 0
              ? activeReading.map((item) => `
                <article class="nh-panel">
                  <p class="nh-meta-label">${escapeHtml(item.title)}</p>
                  <p class="nh-item-copy">${escapeHtml(item.continueChapterTitle ?? item.latestChapterTitle ?? "Saved continuation available")}${state.pinnedNovelId === item.novelId ? " · because you pinned it" : ""}</p>
                  <p class="nh-item-copy">${escapeHtml(item.continueChapterTitle ? `Because you paused at ${item.continueChapterTitle}, this title stays warm in the active stack.` : "This title stays warm because it still has unfinished reading momentum.")}</p>
                  <div class="nh-actions">
                    ${renderActionButton("Continue", "controller", "continueNovel", item.novelId, "primary")}
                  </div>
                </article>
              `).join("")
              : '<p class="nh-copy">No active in-progress titles right now.</p>'}
          </div>
        </div>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Completed archive",
            title: "Finished titles should remain visible as part of the collection story.",
            copy: "Completed runs are not dead rows. They are part of the reader’s catalog identity.",
            compact: true,
          })}
          <div class="nh-grid">
            <p class="nh-item-copy">${escapeHtml(state.archiveReason ?? "Completed titles should remain visible as part of the collection story.")}</p>
            ${completedItems.length > 0
              ? completedItems.slice(0, 3).map((item) => `
                <article class="nh-panel">
                  <p class="nh-meta-label">${escapeHtml(item.title)}</p>
                  <p class="nh-item-copy">Completed and available for detail re-entry or archive browsing.</p>
                  <div class="nh-actions">
                    ${renderActionButton("Open detail", "controller", "openNovel", item.novelId, "secondary")}
                  </div>
                </article>
              `).join("")
              : '<p class="nh-copy">Completed titles will collect here once longer runs finish.</p>'}
          </div>
        </aside>
      </section>
    `,
  );
}

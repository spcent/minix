import type { ReaderState } from "@minix/feature-reader";

import type { NovelH5PageRenderContext } from "../types";
import { renderChipRow } from "../components/chip-row";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, formatDate, renderActionButton, renderParagraphs, splitParagraphs } from "../utils";

export function renderReaderPage(context: NovelH5PageRenderContext, state: ReaderState): string {
  const chapter = state.chapter;
  const content = state.accessState === "open" ? chapter?.content : state.previewContent;
  const [leftColumn, rightColumn] = splitParagraphs(content);
  const readTrailCountLabel =
    state.totalChapters > 0 ? `${state.readChapterIds.length} of ${state.totalChapters}` : String(state.readChapterIds.length);
  const nextChapterButtonLabel = state.nextChapterTitle ? `Next · ${state.nextChapterTitle}` : "Next";
  const completionButtonLabel = state.nextChapterTitle ? "Complete + Continue" : "Mark Chapter Complete";
  const chapterComplete = state.chapterCompletionState === "completed";
  const readingTrailCopy =
    state.currentVolumeTitle
      ? `${state.currentVolumeTitle} · Chapter ${chapter?.order ?? "?"}${state.totalChapters > 0 ? ` of ${state.totalChapters}` : ""}`
      : `Chapter ${chapter?.order ?? "?"}${state.totalChapters > 0 ? ` of ${state.totalChapters}` : ""}`;
  const nextUpCopy =
    state.nextStepLabel ??
    (state.nextChapterTitle
      ? `Continuous reading can flow straight into ${state.nextChapterTitle} without leaving the surface.`
      : "This chapter currently sits at the edge of the available reading queue.");
  const sessionCopy = state.sessionElapsedLabel ?? "Session active just now";
  const completionMessage =
    state.chapterCompletionMessage ??
    (state.nextChapterTitle
      ? `This chapter is saved as complete. Continue directly into ${state.nextChapterTitle}, or reopen the directory if you want to change the route.`
      : "This chapter is saved as complete. You are at the latest available point in this reading run.");
  const completionSummaryTitle =
    state.completionSummaryTitle ??
    (chapterComplete ? `${chapter?.title ?? state.title} complete` : state.chapterCompletionState === "continued" ? `Moved into ${chapter?.title ?? state.title}` : undefined);
  const completionSummaryCopy =
    state.completionSummaryCopy ??
    (chapterComplete
      ? completionMessage
      : state.chapterCompletionState === "continued"
        ? state.chapterCompletionMessage ?? nextUpCopy
        : undefined);
  const completionSummaryMeta =
    state.completionSummaryMeta ??
    (state.chapterCompletionState !== "reading"
      ? `${state.currentVolumeTitle ? `${state.currentVolumeTitle} · ` : ""}${readTrailCountLabel} tracked`
      : undefined);
  const paperClass =
    state.theme === "night"
      ? "nh-reader-paper nh-reader-paper-night"
      : state.theme === "sepia"
        ? "nh-reader-paper nh-reader-paper-sepia"
        : "nh-reader-paper";
  const progressPercentLabel = `${Math.round(state.progressPercent * 100)}%`;
  const volumeProgressLabel = state.volumeProgressLabel ?? (state.totalChapters > 0 ? `${state.readChapterIds.length}/${state.totalChapters} chapters tracked` : "Active volume lane");
  const surfaceClassName = state.accessState === "open" ? "nh-reader-surface" : "nh-reader-surface nh-reader-surface-gated";
  const accessHeadline =
    state.accessState === "locked"
      ? "This chapter is currently behind the membership boundary."
      : state.accessState === "trial"
        ? "Trial reading is open, but the full chapter continues past the preview cut."
        : "";
  const accessCopy =
    state.accessState === "locked"
      ? "Keep the reader calm even when access is blocked: explain the boundary, preserve context, and route cleanly to membership."
      : state.accessState === "trial"
        ? "The reader should still feel premium in trial mode. Show enough text to preserve flow, then transition cleanly into the membership path."
        : "";

  return renderAppShell(
    "reader",
    `
      <section class="nh-reader-shell">
        <header class="nh-reader-topbar">
          <div class="nh-reader-topbar-main">
            <div class="nh-grid">
              <div class="nh-kicker">Immersive reader</div>
              <h1 class="nh-reader-titlebar">${escapeHtml(chapter?.title ?? state.title)}</h1>
              <div class="nh-inline">
                <span class="nh-meta">Chapter ${chapter?.order ?? "?"}</span>
                <span class="nh-meta">${escapeHtml(formatDate(chapter?.updatedAt))}</span>
                <span class="nh-meta">${progressPercentLabel} read</span>
                <span class="nh-meta">${escapeHtml(sessionCopy)}</span>
                <span class="nh-meta">${escapeHtml(state.saveStatusLabel ?? (state.savingProgress ? "Saving progress..." : state.lastSavedAt ? `Saved ${formatDate(state.lastSavedAt)}` : "Not saved yet"))}</span>
                ${state.readingStateLabel ? `<span class="nh-meta">${escapeHtml(state.readingStateLabel)}</span>` : ""}
              </div>
            </div>
            <div class="nh-reader-progress-track" aria-hidden="true">
              <div class="nh-reader-progress-fill" style="width:${state.progressPercent * 100}%"></div>
            </div>
          </div>
          <div class="nh-reader-topbar-actions">
            ${renderActionButton("Library", "controller", "goToNovelDetail", undefined, "ghost")}
            ${renderActionButton("Directory page", "controller", "goToToc", undefined, "ghost")}
            ${renderActionButton("Shelf", "controller", "goToBookshelf", undefined, "ghost")}
            <button class="nh-button nh-button-ghost" type="button" data-ui-open="toc">Open TOC</button>
            <button class="nh-button nh-button-secondary" type="button" data-ui-open="display">Display</button>
            ${
              state.accessState !== "open"
                ? `<button class="nh-button" type="button" data-ui-open="access">Unlock</button>`
                : ""
            }
          </div>
        </header>
        <section class="nh-reader-sequence-strip">
          <article class="nh-reader-sequence-card">
            <p class="nh-meta-label">Reading trail</p>
            <h2 class="nh-title-small">${escapeHtml(readingTrailCopy)}</h2>
            <p class="nh-item-copy">${escapeHtml(state.activeProgramSummary ?? "The reader now keeps the live chapter aligned with the in-session continuation trail.")}</p>
            ${renderChipRow([
              `${readTrailCountLabel} chapters in trail`,
              volumeProgressLabel,
              state.continueChapterId ? "Resume point is live" : undefined,
              state.sessionElapsedLabel,
            ])}
          </article>
          <article class="nh-reader-sequence-card">
            <p class="nh-meta-label">Next up</p>
            <h2 class="nh-title-small">${escapeHtml(state.nextChapterTitle ?? "Latest available chapter")}</h2>
            <p class="nh-item-copy">${escapeHtml(state.chapterCompletionState === "continued" ? (state.chapterCompletionMessage ?? nextUpCopy) : nextUpCopy)}</p>
            <div class="nh-actions">
              ${renderActionButton(completionButtonLabel, "controller", "completeChapterAndContinue", undefined, "primary")}
              ${state.nextChapterTitle ? renderActionButton(nextChapterButtonLabel, "controller", "goToNextChapter", undefined, "secondary") : renderActionButton("Open directory", "controller", "goToToc", undefined, "secondary")}
              <button class="nh-button nh-button-ghost" type="button" data-ui-open="toc">Review queue in TOC</button>
            </div>
          </article>
        </section>
        <section class="nh-reader-sequence-strip">
          <article class="nh-reader-sequence-card">
            <p class="nh-meta-label">Backlog re-entry</p>
            <h2 class="nh-title-small">${escapeHtml(volumeProgressLabel)}</h2>
            <p class="nh-item-copy">${escapeHtml(state.backlogReentryLabel ?? "This run is still too early for backlog re-entry signals.")}</p>
            ${state.volumeHandoffLabel ? `<p class="nh-item-copy">${escapeHtml(state.volumeHandoffLabel)}</p>` : ""}
          </article>
        </section>
        ${
          state.programMilestoneTitle
            ? `
              <section class="nh-reader-sequence-strip">
                <article class="nh-reader-sequence-card">
                  <p class="nh-meta-label">Volume milestone</p>
                  <h2 class="nh-title-small">${escapeHtml(state.programMilestoneTitle)}</h2>
                  <p class="nh-item-copy">${escapeHtml(state.programMilestoneCopy ?? "Completed volumes should remain visible as stable milestones, not disappear behind chapter-level cues.")}</p>
                  ${renderChipRow([state.programMilestoneMeta])}
                </article>
              </section>
            `
            : ""
        }
        ${
          state.chapterCompletionState !== "reading"
            ? `
              <section class="nh-reader-sequence-strip">
                <article class="nh-reader-sequence-card">
                  <p class="nh-meta-label">Post-chapter recap</p>
                  <h2 class="nh-title-small">${escapeHtml(completionSummaryTitle ?? "Reading recap")}</h2>
                  <p class="nh-item-copy">${escapeHtml(completionSummaryCopy ?? completionMessage)}</p>
                  ${
                    completionSummaryMeta
                      ? renderChipRow([completionSummaryMeta, sessionCopy, state.saveStatusLabel ?? "Progress saved"])
                      : ""
                  }
                  <div class="nh-actions">
                    ${state.nextChapterTitle ? renderActionButton("Open next step", "controller", "goToNextChapter", undefined, "primary") : renderActionButton("Back to title dossier", "controller", "goToNovelDetail", undefined, "secondary")}
                    ${renderActionButton("Review directory", "controller", "goToToc", undefined, "ghost")}
                  </div>
                </article>
              </section>
            `
            : ""
        }
        ${
          chapterComplete
            ? `
              <section class="nh-reader-sequence-strip">
                <article class="nh-reader-sequence-card">
                  <p class="nh-meta-label">Chapter complete</p>
                  <h2 class="nh-title-small">${escapeHtml(chapter?.title ?? state.title)}</h2>
                  <p class="nh-item-copy">${escapeHtml(completionMessage)}</p>
                  <div class="nh-actions">
                    ${state.nextChapterTitle ? renderActionButton("Open next chapter", "controller", "goToNextChapter", undefined, "primary") : renderActionButton("Back to detail", "controller", "goToNovelDetail", undefined, "secondary")}
                    ${renderActionButton("Open TOC", "controller", "goToToc", undefined, "ghost")}
                  </div>
                </article>
              </section>
            `
            : ""
        }
        <section class="${surfaceClassName}">
          ${state.displaySyncMessage ? `<div class="nh-reader-banner"><p class="nh-note">${escapeHtml(state.displaySyncMessage)}</p></div>` : ""}
          ${state.chapterCompletionState === "continued" && state.chapterCompletionMessage ? `<div class="nh-reader-banner"><p class="nh-note">${escapeHtml(state.chapterCompletionMessage)}</p></div>` : ""}
          ${state.accessMessage ? `<div class="nh-reader-banner"><p class="nh-note">${escapeHtml(state.accessMessage)}</p></div>` : ""}
          <article class="${paperClass}" style="font-size:${state.fontScale}em">
            <div class="nh-reader-paper-head">
              <div class="nh-grid">
                <div class="nh-kicker">Reading surface</div>
                <h2 class="nh-reader-title">${escapeHtml(chapter?.title ?? state.title)}</h2>
                <p class="nh-copy">
                  ${escapeHtml(
                    state.mode === "page"
                      ? "Two-page spread mode is active. This should feel closer to a designed folio than a raw text dump."
                      : "Scroll mode is active. Prioritize calm line length, legibility, and low-noise controls.",
                  )}
                </p>
              </div>
              <div class="nh-reader-mode-pill">${escapeHtml(state.theme)} · ${escapeHtml(state.mode)}</div>
            </div>
            ${
              state.mode === "page"
                ? `<div class="nh-reader-columns">${renderParagraphs(leftColumn)}${renderParagraphs(rightColumn)}</div>`
                : `<div>${renderParagraphs([...leftColumn, ...rightColumn])}</div>`
            }
          </article>
          ${
            state.accessState !== "open"
              ? `
                <aside class="nh-reader-access-overlay">
                  <div class="nh-reader-access-card">
                    <div class="nh-kicker">Membership boundary</div>
                    <h3 class="nh-title-small">${escapeHtml(accessHeadline)}</h3>
                    <p class="nh-copy">${escapeHtml(accessCopy)}</p>
                    ${renderChipRow([
                      state.accessBadgeLabel ?? state.accessState,
                      `${progressPercentLabel} retained`,
                      state.readingStateLabel,
                      chapter?.trialEndOffset ? `Preview cut at ${chapter.trialEndOffset} chars` : undefined,
                    ])}
                    <div class="nh-actions">
                      ${renderActionButton(state.membershipActionLabel ?? "Unlock membership", "controller", "goToMembership", undefined, "primary")}
                      ${renderActionButton("Back to detail", "controller", "goToNovelDetail", undefined, "ghost")}
                    </div>
                  </div>
                </aside>
              `
              : ""
          }
        </section>
        <footer class="nh-reader-toolbar">
          <div class="nh-reader-toolbar-cluster">
            ${renderActionButton("Previous", "controller", "goToPreviousChapter", undefined, "ghost")}
            ${renderActionButton(completionButtonLabel, "controller", "completeChapterAndContinue", undefined, "primary")}
            ${renderActionButton(nextChapterButtonLabel, "controller", "goToNextChapter", undefined, "secondary")}
            <button class="nh-button nh-button-ghost" type="button" data-ui-open="toc">Contents</button>
          </div>
          <div class="nh-reader-toolbar-cluster">
            ${renderActionButton("A-", "controller", "decreaseFontScale", undefined, "ghost")}
            ${renderActionButton("A+", "controller", "increaseFontScale", undefined, "ghost")}
            ${renderActionButton(`Theme · ${state.theme}`, "controller", "cycleTheme", undefined, "ghost")}
            ${renderActionButton(`Mode · ${state.mode}`, "controller", "cycleMode", undefined, "ghost")}
            ${renderActionButton("Save progress", "controller", "saveProgress", undefined, "secondary")}
            <button class="nh-button nh-button-secondary" type="button" data-ui-open="display">Display</button>
            ${
              state.accessState !== "open"
                ? `<button class="nh-button" type="button" data-ui-open="access">Unlock</button>`
                : ""
            }
          </div>
        </footer>
        <aside class="nh-reader-panel" data-ui-panel="toc" aria-hidden="true">
          <div class="nh-reader-panel-sheet">
            <div class="nh-reader-panel-head">
              <div class="nh-grid">
                <div class="nh-kicker">Contents drawer</div>
                <h3 class="nh-title-small">Browse chapters without leaving the reader.</h3>
              </div>
              <button class="nh-button nh-button-ghost" type="button" data-ui-close="toc">Close</button>
            </div>
            <div class="nh-reader-panel-body" data-reader-panel-body="toc">
              <div class="nh-reader-panel-loading">Loading chapter list...</div>
            </div>
          </div>
        </aside>
        <aside class="nh-reader-panel" data-ui-panel="display" aria-hidden="true">
          <div class="nh-reader-panel-sheet">
            <div class="nh-reader-panel-head">
              <div class="nh-grid">
                <div class="nh-kicker">Display settings</div>
                <h3 class="nh-title-small">Adjust theme, mode, type scale, and progress.</h3>
              </div>
              <button class="nh-button nh-button-ghost" type="button" data-ui-close="display">Close</button>
            </div>
            <div class="nh-reader-panel-body">
              <div class="nh-reader-settings-grid">
                <article class="nh-panel">
                  <p class="nh-meta-label">Type scale</p>
                  <div class="nh-actions">
                    ${renderActionButton("A-", "controller", "decreaseFontScale", undefined, "ghost")}
                    <span class="nh-reader-setting-value">${Math.round(state.fontScale * 100)}%</span>
                    ${renderActionButton("A+", "controller", "increaseFontScale", undefined, "ghost")}
                  </div>
                </article>
                <article class="nh-panel">
                  <p class="nh-meta-label">Theme and mode</p>
                  <div class="nh-actions">
                    ${renderActionButton(`Theme · ${state.theme}`, "controller", "cycleTheme", undefined, "secondary")}
                    ${renderActionButton(`Mode · ${state.mode}`, "controller", "cycleMode", undefined, "secondary")}
                  </div>
                </article>
                <article class="nh-panel">
                  <p class="nh-meta-label">Progress</p>
                  <label class="nh-reader-progress-control">
                    <input type="range" min="0" max="100" value="${Math.round(state.progressPercent * 100)}" data-input="reader-progress" />
                    <span class="nh-reader-setting-value">${progressPercentLabel}</span>
                  </label>
                  <div class="nh-actions">
                    ${renderActionButton("Save now", "controller", "saveProgress", undefined, "primary")}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </aside>
        <aside class="nh-reader-panel" data-ui-panel="access" aria-hidden="true">
          <div class="nh-reader-panel-sheet">
            <div class="nh-reader-panel-head">
              <div class="nh-grid">
                <div class="nh-kicker">Membership path</div>
                <h3 class="nh-title-small">Explain the paywall without breaking the reading mood.</h3>
              </div>
              <button class="nh-button nh-button-ghost" type="button" data-ui-close="access">Close</button>
            </div>
            <div class="nh-reader-panel-body">
              <div class="nh-grid">
                <article class="nh-panel">
                  <p class="nh-meta-label">Current state</p>
                  <p class="nh-copy">${escapeHtml(state.accessMessage ?? "Open chapter with no membership boundary.")}</p>
                  ${renderChipRow([state.accessBadgeLabel ?? state.accessState, chapter?.title ?? state.title, state.saveStatusLabel])}
                </article>
                <article class="nh-panel">
                  <p class="nh-meta-label">Unlock outcome</p>
                  <p class="nh-copy">Membership should return the reader to this chapter, preserve progress, and keep the top-level story context intact.</p>
                  <div class="nh-actions">
                    ${renderActionButton(state.membershipActionLabel ?? "Open membership", "controller", "goToMembership", undefined, "primary")}
                    ${renderActionButton("Back to detail", "controller", "goToNovelDetail", undefined, "ghost")}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </aside>
      </section>
    `,
    { immersive: true },
  );
}

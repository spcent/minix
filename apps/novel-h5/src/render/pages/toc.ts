import type { TocState } from "@minix/feature-toc";

import { describeChapterFlow, findNextChapter } from "../components/chapter-flow";
import type { NovelH5PageRenderContext } from "../types";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton } from "../utils";

export function renderTocPage(context: NovelH5PageRenderContext, state: TocState): string {
  const totalRead = state.readChapterIds.length;
  const nextChapter = findNextChapter(state.volumes, state.currentChapterId);

  return renderAppShell(
    "toc",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Directory</div>
          <h1 class="nh-title-small">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">The TOC should show not just structure, but reading position: what is current, what is already read, and where the membership boundary starts.</p>
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Volumes</p>
              <p class="nh-stat-value">${String(state.volumes.length).padStart(2, "0")}</p>
              <p class="nh-item-copy">Story arcs in view</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Read</p>
              <p class="nh-stat-value">${String(totalRead).padStart(2, "0")}</p>
              <p class="nh-item-copy">Chapters completed or in progress</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Current</p>
              <p class="nh-stat-value">${escapeHtml(state.currentChapterId ?? "None")}</p>
              <p class="nh-item-copy">Persistent reader highlight carried into the directory</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Next up</p>
              <p class="nh-stat-value">${escapeHtml(nextChapter?.title ?? "Latest")}</p>
              <p class="nh-item-copy">${nextChapter ? "Immediate continuation from the current trail" : "No later chapter in the active queue"}</p>
            </article>
          </div>
          ${state.currentVolumeProgressLabel ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.currentVolumeProgressLabel)}</p></div>` : ""}
          ${state.currentVolumeSummary ? `<p class="nh-item-copy">${escapeHtml(state.currentVolumeSummary)}</p>` : ""}
        </div>
        <div class="nh-actions">
          ${renderActionButton("Open selected chapter", "controller", "openSelectedChapter", undefined, "primary")}
          ${state.currentChapterId ? renderActionButton("Back to current chapter", "controller", "jumpToCurrentChapter", undefined, "secondary") : ""}
          ${renderActionButton("Back to detail", "controller", "goToNovelDetail", undefined, "ghost")}
        </div>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          <div class="nh-grid">
            <div class="nh-kicker">Active reading program</div>
            <h2 class="nh-title-small">${escapeHtml(state.currentVolumeProgressLabel ?? "Volume progress will appear once a current lane exists.")}</h2>
            <p class="nh-item-copy">${escapeHtml(state.currentVolumeSummary ?? "The directory should explain which volume is still alive in the current reading run.")}</p>
            ${state.nextVolumeHandoffLabel ? `<p class="nh-item-copy">${escapeHtml(state.nextVolumeHandoffLabel)}</p>` : ""}
          </div>
        </section>
        <aside class="nh-card">
          <div class="nh-grid">
            <div class="nh-kicker">Backlog re-entry</div>
            <p class="nh-item-copy">${escapeHtml(state.backlogReentryLabel ?? "Backlog re-entry stays quiet until a finished volume exists.")}</p>
          </div>
        </aside>
      </section>
      ${
        state.programMilestoneTitle
          ? `
            <section class="nh-card">
              <div class="nh-grid">
                <div class="nh-kicker">Volume milestone</div>
                <h2 class="nh-title-small">${escapeHtml(state.programMilestoneTitle)}</h2>
                <p class="nh-item-copy">${escapeHtml(state.programMilestoneCopy ?? "Completed volumes should remain first-class milestones inside the directory.")}</p>
                ${state.programMilestoneMeta ? `<div class="nh-chip-row"><span class="nh-chip">${escapeHtml(state.programMilestoneMeta)}</span></div>` : ""}
              </div>
            </section>
          `
          : ""
      }
      <section class="nh-card nh-grid">
        ${state.volumes
          .map(
            (volume) => `
              <article class="nh-panel">
                <div class="nh-actions">
                  <div class="nh-grid">
                    <div class="nh-kicker">${escapeHtml(volume.title)}</div>
                    <p class="nh-item-copy">
                      ${volume.id === state.currentVolumeId ? "Current reading volume" : "Secondary volume lane"}
                      ${state.expandedVolumeId === volume.id ? " · expanded" : " · collapsed"}
                    </p>
                  </div>
                  ${renderActionButton(state.expandedVolumeId === volume.id ? "Collapse volume" : "Expand volume", "controller", "toggleVolume", volume.id, "ghost")}
                </div>
                ${
                  state.expandedVolumeId !== volume.id
                    ? `<p class="nh-item-copy">Collapsed to keep the live reading lane quiet during longer sessions.</p>`
                    : `
                <div class="nh-grid">
                  ${volume.chapters
                    .map((chapter) => {
                      const descriptor = describeChapterFlow(chapter, {
                        currentChapterId: state.currentChapterId,
                        continueChapterId: state.continueChapterId,
                        nextChapterId: nextChapter?.id,
                        readChapterIds: state.readChapterIds,
                      });

                      return `
                        <article class="nh-item${state.selectedChapterId === chapter.id || state.highlightedChapterId === chapter.id ? " nh-item-active" : ""}">
                          <h3 class="nh-item-title">${escapeHtml(chapter.title)}</h3>
                          <div class="nh-chip-row">
                            ${descriptor.chips.map((chip) => `<span class="nh-chip">${escapeHtml(chip)}</span>`).join("")}
                            ${state.highlightedChapterId === chapter.id ? `<span class="nh-chip">Pinned highlight</span>` : ""}
                          </div>
                          <p class="nh-item-copy">${escapeHtml(descriptor.copy)}</p>
                          <div class="nh-actions">
                            ${renderActionButton("Select", "controller", "selectChapter", chapter.id)}
                            ${renderActionButton(chapter.id === state.currentChapterId ? "Resume" : descriptor.actionLabel, "controller", "goToReader", chapter.id, "ghost")}
                          </div>
                        </article>
                      `;
                    })
                    .join("")}
                </div>
                `
                }
              </article>
            `,
          )
          .join("")}
      </section>
    `,
  );
}

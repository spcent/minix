import type { TocState } from "@minix/feature-toc";

import { renderChipRow } from "../components/chip-row";
import { describeChapterFlow, findNextChapter } from "../components/chapter-flow";
import { renderStatPanels } from "../components/stat-panel";
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
            ${renderStatPanels([
              {
                label: "Volumes",
                value: String(state.volumes.length).padStart(2, "0"),
                note: "Story arcs in view",
              },
              {
                label: "Read",
                value: String(totalRead).padStart(2, "0"),
                note: "Chapters completed or in progress",
              },
              {
                label: "Current",
                value: state.currentChapterId ?? "None",
                note: "Persistent reader highlight carried into the directory",
              },
              {
                label: "Next up",
                value: nextChapter?.title ?? "Latest",
                note: nextChapter ? "Immediate continuation from the current trail" : "No later chapter in the active queue",
              },
            ])}
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
                ${renderChipRow([state.programMilestoneMeta])}
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
                          ${renderChipRow([
                            ...descriptor.chips,
                            state.highlightedChapterId === chapter.id ? "Pinned highlight" : undefined,
                          ])}
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

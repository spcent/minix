import type { ChapterListResponse } from "@minix/contracts";
import type { ReaderState } from "@minix/feature-reader";

import { describeChapterFlow, findNextChapter } from "./chapter-flow";
import { escapeHtml, formatDate, formatCompactNumber, renderActionButton } from "../utils";

export function renderReaderTocPanelBody(toc: ChapterListResponse, state: ReaderState): string {
  const nextChapter = findNextChapter(toc.volumes, state.chapter?.id);

  return `
    <div class="nh-reader-panel-summary">
      <div class="nh-grid">
        <p class="nh-meta-label">Novel chapters</p>
        <p class="nh-copy">${toc.totalChapters} chapters across ${toc.volumes.length} volume${toc.volumes.length === 1 ? "" : "s"} with the live reading trail pinned to the current chapter.</p>
      </div>
      <div class="nh-actions">
        ${state.chapter?.id ? renderActionButton("Back to current chapter", "controller", "goToChapter", state.chapter.id, "secondary") : ""}
        ${state.nextChapterTitle ? renderActionButton(`Next · ${state.nextChapterTitle}`, "controller", "goToNextChapter", undefined, "ghost") : ""}
      </div>
      <div class="nh-chip-row">
        <span class="nh-chip">Current ${escapeHtml(state.chapter?.title ?? state.title)}</span>
        ${state.currentVolumeTitle ? `<span class="nh-chip">${escapeHtml(state.currentVolumeTitle)}</span>` : ""}
        ${state.nextChapterTitle ? `<span class="nh-chip">Next ${escapeHtml(state.nextChapterTitle)}</span>` : ""}
        <span class="nh-chip">${state.readChapterIds.length} chapters in trail</span>
      </div>
      ${
        nextChapter
          ? `<p class="nh-item-copy">Next up in the live queue: ${escapeHtml(nextChapter.title)}.</p>`
          : `<p class="nh-item-copy">You are at the latest available chapter in this reading queue.</p>`
      }
    </div>
    <div class="nh-reader-toc-list">
      ${toc.volumes
        .map(
          (volume) => `
            <section class="nh-reader-volume">
              <div class="nh-reader-volume-head">
                <div>
                  <p class="nh-meta-label">${escapeHtml(volume.title)}</p>
                  <p class="nh-item-copy">${volume.chapters.length} chapters${volume.title === state.currentVolumeTitle ? " · current reading lane" : ""}</p>
                </div>
              </div>
              <div class="nh-reader-chapter-list">
                ${volume.chapters
                  .map(
                    (chapter) => {
                      const descriptor = describeChapterFlow(chapter, {
                        currentChapterId: state.chapter?.id,
                        continueChapterId: state.continueChapterId,
                        nextChapterId: state.chapter?.nav.nextChapterId,
                        readChapterIds: state.readChapterIds,
                      });

                      return `
                      <article class="nh-reader-chapter-item${chapter.id === state.chapter?.id ? " nh-reader-chapter-item-active" : ""}">
                        <div class="nh-grid">
                          <div class="nh-chip-row">
                            <span class="nh-chip">Ch. ${chapter.order}</span>
                            ${descriptor.chips.map((chip) => `<span class="nh-chip">${escapeHtml(chip)}</span>`).join("")}
                          </div>
                          <h4 class="nh-reader-chapter-title">${escapeHtml(chapter.title)}</h4>
                          <p class="nh-item-copy">
                            ${formatCompactNumber(chapter.wordCount)} words · ${escapeHtml(formatDate(chapter.updatedAt))}
                          </p>
                          <p class="nh-item-copy">${escapeHtml(descriptor.copy)}</p>
                        </div>
                        <div class="nh-actions">
                          ${
                            chapter.id === state.chapter?.id
                              ? `<span class="nh-reader-current-pill">Current</span>`
                              : renderActionButton(descriptor.actionLabel, "controller", "goToChapter", chapter.id, "secondary")
                          }
                        </div>
                      </article>
                    `;
                    },
                  )
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

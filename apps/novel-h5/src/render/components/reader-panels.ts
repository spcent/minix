import type { ChapterListResponse } from "@minix/contracts";
import type { ReaderState } from "@minix/feature-reader";

import { renderActionRow } from "./action-row";
import { describeChapterFlow, findNextChapter } from "./chapter-flow";
import { renderChipRow } from "./chip-row";
import { escapeHtml, formatDate, formatCompactNumber, renderActionButton } from "../utils";

export function renderReaderTocPanelBody(toc: ChapterListResponse, state: ReaderState): string {
  const nextChapter = findNextChapter(toc.volumes, state.chapter?.id);

  return `
    <div class="nh-reader-panel-summary">
      <div class="nh-grid">
        <p class="nh-meta-label">Novel chapters</p>
        <p class="nh-copy">${toc.totalChapters} chapters across ${toc.volumes.length} volume${toc.volumes.length === 1 ? "" : "s"} with the live reading trail pinned to the current chapter.</p>
      </div>
      ${renderActionRow([
        state.chapter?.id ? renderActionButton("Back to current chapter", "controller", "goToChapter", state.chapter.id, "secondary") : undefined,
        state.nextChapterTitle ? renderActionButton(`Next · ${state.nextChapterTitle}`, "controller", "goToNextChapter", undefined, "ghost") : undefined,
      ])}
      ${renderChipRow([
        `Current ${state.chapter?.title ?? state.title}`,
        state.currentVolumeTitle,
        state.nextChapterTitle ? `Next ${state.nextChapterTitle}` : undefined,
        `${state.readChapterIds.length} chapters in trail`,
      ])}
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
                          ${renderChipRow([`Ch. ${chapter.order}`, ...descriptor.chips])}
                          <h4 class="nh-reader-chapter-title">${escapeHtml(chapter.title)}</h4>
                          <p class="nh-item-copy">
                            ${formatCompactNumber(chapter.wordCount)} words · ${escapeHtml(formatDate(chapter.updatedAt))}
                          </p>
                          <p class="nh-item-copy">${escapeHtml(descriptor.copy)}</p>
                        </div>
                        ${renderActionRow([
                          chapter.id === state.chapter?.id
                            ? `<span class="nh-reader-current-pill">Current</span>`
                            : renderActionButton(descriptor.actionLabel, "controller", "goToChapter", chapter.id, "secondary"),
                        ])}
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

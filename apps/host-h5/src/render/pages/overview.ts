import { escapeHtml } from "@minix/core";

import { renderButton } from "../components/buttons";
import {
  buildResumeTaskDescription,
  buildResumeTaskLabel,
  findCurrentFocusItem,
  findLastCompletedItem,
} from "../components/learning";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";
import { formatProgressTimestamp } from "../utils";
import { ensureItemsProgress } from "./items-progress";

export function renderOverviewPage({ root, runtime, sync }: HostH5PageRenderContext) {
  ensureItemsProgress(runtime, sync);
  const state = runtime.pages.overview.store.getState();
  const completedCount = state.items.filter((item) => item.completed).length;
  const remainingCount = state.items.length - completedCount;
  const isLessonComplete = state.items.length > 0 && remainingCount === 0;
  const progressPercent = state.items.length === 0 ? 0 : Math.round((completedCount / state.items.length) * 100);
  const recommendedNext = findCurrentFocusItem(state.items);
  const lastCompletedItem = findLastCompletedItem(state.items);
  const resumeTaskLabel = buildResumeTaskLabel(recommendedNext ?? lastCompletedItem, completedCount, remainingCount);
  const resumeTaskDescription = buildResumeTaskDescription(recommendedNext ?? lastCompletedItem, completedCount, remainingCount);
  const overviewRecommendationTitle = isLessonComplete
    ? "Today's lesson is complete. Use Overview to reopen the finished flow, review the wrap-up, or head back into the plan for a recap pass."
    : state.featuredReason ?? "Today's plan moves from vocabulary to listening and then active speaking.";
  const overviewRecommendationPoints = isLessonComplete
    ? [
        `All ${state.items.length} visible tasks are now complete`,
        "Overview has shifted from progress tracking to review guidance",
        "Open Today's Plan to revisit any completed step without restarting the session",
      ]
    : [
        `${remainingCount} tasks still open in today's study flow`,
        "Use Overview to choose the next best task before opening the full plan",
        "Preferences stays one step away for reminder and goal review",
      ];
  const snapshotTitle = isLessonComplete
    ? "Today's lesson is complete and ready to review"
    : `${progressPercent}% of today's visible study flow is complete`;
  const snapshotNote = isLessonComplete
    ? "You finished the single-lesson loop. Open Today's Plan to review the completed queue, revisit the wrap-up, or keep this session as today's finished lesson."
    : "Overview is a dashboard, not the execution page. Open Today's Plan when you are ready to work through the full queue.";
  const focusSectionKicker = isLessonComplete ? "Completed lesson" : "Today's focus";
  const focusSectionTitle = isLessonComplete ? "Finished lesson preview" : "Recommended next items";
  const focusSectionSubtitle = isLessonComplete
    ? "A recap view of the completed lesson so you can see what was finished before reopening the full queue."
    : "A quick preview of the lesson queue so you can decide where to continue without jumping straight into the full task list.";
  const resumeSectionKicker = isLessonComplete ? "Lesson Complete" : "Resume From Last Task";
  const resumeCardTitle = isLessonComplete
    ? "Completed lesson ready for recap"
    : recommendedNext?.title ?? lastCompletedItem?.title ?? "Resume today's plan";
  const resumeStageValue = isLessonComplete
    ? "Review Mode"
    : recommendedNext?.categoryLabel ?? lastCompletedItem?.categoryLabel ?? "Overview";
  const resumeEffortValue = isLessonComplete
    ? `${state.items.length || 0} tasks done`
    : recommendedNext?.durationMinutes
      ? `${recommendedNext.durationMinutes} min`
      : lastCompletedItem?.durationMinutes
        ? `${lastCompletedItem.durationMinutes} min`
        : "10 min";
  const resumeReason = isLessonComplete
    ? lastCompletedItem?.recommendedReason ??
      "Reopen the finished lesson while the sequence is still fresh, then revisit any stage you want to reinforce."
    : recommendedNext?.recommendedReason;
  const previewMarkup = state.items
    .slice(0, 3)
    .map(
      (item, index) => `
        <article class="me-lesson-card ${item.completed ? "me-lesson-card-complete" : ""}">
          <div class="me-lesson-meta">
            <span class="me-lesson-index">Focus ${index + 1}</span>
            <span class="me-lesson-badge ${item.completed ? "me-lesson-badge-complete" : ""}">${item.completed ? "Completed" : item.categoryLabel ?? "Today"}</span>
          </div>
          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="me-lesson-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
          ${
            item.recommendedReason
              ? `<p class="me-lesson-reason">${escapeHtml(item.recommendedReason)}</p>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  renderApp(
    root,
    "Your Daily English Overview",
    runtime,
    "overview",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-overview-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Overview</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Start here after home to understand today's focus, current progress, and the fastest next action.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">Session active</span>
              <span class="me-chip me-chip-accent">${isLessonComplete ? "Lesson complete" : `${completedCount}/${state.items.length || 0} complete`}</span>
              <span class="me-chip">${escapeHtml(isLessonComplete ? "Ready to review" : recommendedNext?.categoryLabel ?? "Lesson Flow")}</span>
              <span class="me-chip me-chip-warm">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</span>
            </div>
          </div>
          <aside class="me-panel me-overview-panel">
            <p class="me-panel-kicker">Today's recommendation</p>
            <h2 class="me-panel-title">${escapeHtml(overviewRecommendationTitle)}</h2>
            <ul class="me-panel-list">
              ${overviewRecommendationPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </aside>
        </section>

        <section class="me-stat-grid me-overview-stats">
          <article class="me-stat-card">
            <p class="me-stat-value">${state.items.length}</p>
            <p class="me-stat-label">Today's visible tasks</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${completedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Completed in this lesson" : "Completed today"}</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${isLessonComplete ? "Ready" : remainingCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Lesson review state" : "Recommended next actions"}</p>
          </article>
        </section>

        <section class="me-surface me-progress-card me-overview-progress">
          <div class="me-progress-row">
            <div class="me-progress-copy">
              <p class="me-section-kicker">Daily snapshot</p>
              <h2 class="me-progress-title">${escapeHtml(snapshotTitle)}</h2>
              <p class="me-progress-note">
                ${escapeHtml(snapshotNote)}
              </p>
            </div>
            <div class="me-progress-pill">${progressPercent}%</div>
          </div>
          <div class="me-progress-track" aria-hidden="true">
            <span class="me-progress-fill" style="width:${progressPercent}%"></span>
          </div>
          <div class="me-action-group">
            ${renderButton("overview-open-plan", resumeTaskLabel, "primary")}
            ${renderButton("overview-open-settings", "Learning Preferences", "secondary")}
          </div>
        </section>

        <section class="me-grid me-grid-columns me-overview-workspace">
          <section class="me-surface me-card me-overview-card">
            <p class="me-section-kicker">${escapeHtml(focusSectionKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(focusSectionTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(focusSectionSubtitle)}
            </p>
            ${
              state.loading && state.items.length === 0
                ? `<div class="me-empty-state">Loading your overview...</div>`
                : ""
            }
            ${
              state.errorText
                ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>`
                : ""
            }
            ${
              !state.loading && state.items.length === 0
                ? `<div class="me-empty-state">${escapeHtml(state.emptyText ?? "No overview tasks yet.")}</div>`
                : ""
            }
            ${state.items.length > 0 ? `<div class="me-lesson-list">${previewMarkup}</div>` : ""}
          </section>

          <section class="me-surface me-card me-overview-card">
            <p class="me-section-kicker">${escapeHtml(resumeSectionKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(resumeCardTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(resumeTaskDescription)}
            </p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(resumeStageValue)}</p>
                <p class="me-inline-metric-label">Current lesson stage</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(resumeEffortValue)}</p>
                <p class="me-inline-metric-label">Suggested effort</p>
              </div>
            </div>
            ${
              resumeReason
                ? `<p class="me-lesson-reason">${escapeHtml(resumeReason)}</p>`
                : ""
            }
            <div class="me-action-group">
              ${renderButton("overview-go-plan", resumeTaskLabel, "primary")}
              ${renderButton("overview-go-settings", "Open Preferences", "ghost")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "overview-open-plan", () => {
    void runtime.pages.overview.goToPlan().then(sync);
  });
  bindButton(root, "overview-open-settings", () => {
    void runtime.pages.overview.goToSettings().then(sync);
  });
  bindButton(root, "overview-go-plan", () => {
    void runtime.pages.overview.goToPlan().then(sync);
  });
  bindButton(root, "overview-go-settings", () => {
    void runtime.pages.overview.goToSettings().then(sync);
  });
}


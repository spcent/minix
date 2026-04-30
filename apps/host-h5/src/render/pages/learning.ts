import { escapeHtml } from "@minix/core";
import type { ItemsFilterValue, ItemsPageItem } from "@minix/feature-items";

import { renderButton, renderFilterButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5Runtime } from "../../manifest/app.manifest";
import type { HostH5PageRenderContext } from "../types";
import { formatProgressTimestamp } from "../utils";
import { ensureItemsProgress } from "./items-progress";

let completionAnimationTimer: number | null = null;

function filterItems(items: ItemsPageItem[], activeFilter: ItemsFilterValue): ItemsPageItem[] {
  switch (activeFilter) {
    case "completed":
      return items.filter((item) => item.completed);
    case "remaining":
      return items.filter((item) => !item.completed);
    default:
      return items;
  }
}

function findCurrentFocusItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return items.find((item) => !item.completed) ?? items[0];
}

function findLastCompletedItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return [...items].reverse().find((item) => item.completed);
}

function buildResumeTaskLabel(task: ItemsPageItem | undefined, completedCount: number, remainingCount: number): string {
  if (!task) {
    return "Open Today's Plan";
  }

  if (remainingCount === 0) {
    return "Review Completed Lesson";
  }

  if (completedCount === 0) {
    return `Start ${task.title}`;
  }

  return `Resume ${task.title}`;
}

function buildResumeTaskDescription(
  task: ItemsPageItem | undefined,
  completedCount: number,
  remainingCount: number,
): string {
  if (!task) {
    return "Open today's plan to begin the lesson loop.";
  }

  if (remainingCount === 0) {
    return `Today's lesson is complete. Reopen ${task.title} for a quick review pass or revisit the finished queue.`;
  }

  if (completedCount === 0) {
    return `${task.title} is the first active step in today's lesson flow.`;
  }

  return `${task.title} is the next open task in the lesson sequence.`;
}

function resolveSelectedExecutionItem(items: ItemsPageItem[], selectedItemId?: string): ItemsPageItem | undefined {
  return items.find((item) => item.id === selectedItemId) ?? findCurrentFocusItem(items) ?? items[0];
}

function buildTaskChecklist(task: ItemsPageItem | undefined): string[] {
  switch (task?.categoryLabel) {
    case "Warm-up":
      return [
        "Scan the target words once before you try to remember them.",
        "Say each word aloud and notice the pronunciation rhythm.",
        "Choose one word you expect to reuse later in the lesson.",
      ];
    case "Input":
      return [
        "Read the short exchange once without stopping.",
        "Notice the key phrase that links the dialogue together.",
        "Check how the warm-up vocabulary appears in context.",
      ];
    case "Practice":
      return [
        "Rebuild each sentence from the lesson phrases.",
        "Pause for one second before answering so recall stays active.",
        "Keep one corrected pattern ready for the speaking step.",
      ];
    case "Speaking":
      return [
        "Say each line out loud at a steady pace.",
        "Repeat the line once more with more natural rhythm.",
        "Keep the phrase intact before trying to improvise.",
      ];
    case "Wrap-up":
      return [
        "Fix one mistake you noticed during the lesson.",
        "Repeat the key phrase once without looking.",
        "End the lesson with one short confidence check.",
      ];
    default:
      return [
        "Read the task once before acting on it.",
        "Complete the step with one clear focus point in mind.",
        "Keep one phrase or correction ready for the next task.",
      ];
  }
}

function buildTaskOutcome(task: ItemsPageItem | undefined): string {
  if (!task) {
    return "Open a task to see its lesson detail and execution notes.";
  }

  switch (task.categoryLabel) {
    case "Warm-up":
      return "Goal: activate the vocabulary that anchors the rest of today's lesson.";
    case "Input":
      return "Goal: understand how the target words behave inside a real mini-dialogue.";
    case "Practice":
      return "Goal: move the language from recognition into active recall.";
    case "Speaking":
      return "Goal: turn the lesson into spoken output while the patterns are still fresh.";
    case "Wrap-up":
      return "Goal: end with one correction and one phrase you can carry into tomorrow.";
    default:
      return "Goal: complete the current step cleanly before moving to the next task.";
  }
}

function scheduleRecentCompletionReset(runtime: HostH5Runtime, sync: () => void) {
  const { recentlyCompletedItemId } = runtime.pages.items.store.getState();
  if (!recentlyCompletedItemId || typeof window === "undefined") {
    return;
  }

  if (completionAnimationTimer !== null) {
    window.clearTimeout(completionAnimationTimer);
  }

  completionAnimationTimer = window.setTimeout(() => {
    completionAnimationTimer = null;
    runtime.pages.items.clearRecentCompletion();
    sync();
  }, 820);
}

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

export function renderItemsPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.items.store.getState();
  const visibleItems = filterItems(state.items, state.activeFilter);
  const completedLoadedCount = state.items.filter((item) => item.completed).length;
  const remainingLoadedCount = state.items.length - completedLoadedCount;
  const isLessonComplete = state.items.length > 0 && remainingLoadedCount === 0;
  const progressPercent = state.items.length === 0 ? 0 : Math.round((completedLoadedCount / state.items.length) * 100);
  const currentFocusItem = findCurrentFocusItem(state.items);
  const lastCompletedItem = findLastCompletedItem(state.items);
  const selectedExecutionItem = resolveSelectedExecutionItem(state.items, state.selectedItemId);
  const selectedExecutionIndex = selectedExecutionItem ? state.items.findIndex((item) => item.id === selectedExecutionItem.id) : -1;
  const nextItemAfterSelection =
    selectedExecutionIndex >= 0
      ? state.items.slice(selectedExecutionIndex + 1).find((item) => !item.completed) ?? state.items.find((item) => !item.completed)
      : undefined;
  const nextRecommendedItem = state.recentlyCompletedItemId ? findCurrentFocusItem(state.items) : undefined;
  const featuredReason =
    state.featuredReason ?? "Today's plan is balanced to move from vocabulary to listening and then active speaking.";
  const lessonStatus = state.hasMore ? "More practice is available below." : "You are viewing the full lesson queue.";
  const activeFilterLabel =
    state.activeFilter === "completed" ? "Completed tasks only" : state.activeFilter === "remaining" ? "Remaining tasks only" : "All loaded tasks";
  const executionPanelTitle = isLessonComplete
    ? "The execution run is complete. Use this workspace to recap the finished queue or jump back to Overview for the completed lesson summary."
    : featuredReason;
  const executionPanelPoints = isLessonComplete
    ? [
        "All loaded lesson tasks are complete",
        "The queue is now in review mode until you reset progress",
        "Overview will present this session as a completed lesson that can be revisited",
      ]
    : [
        lessonStatus,
        `${remainingLoadedCount} tasks still open in the loaded lesson queue`,
        "Filtering, completion state, and recommendation text all come from the formal feature store",
      ];
  const executionStatusTitle = isLessonComplete
    ? "Lesson complete: the full loaded queue is finished"
    : `${completedLoadedCount} of ${state.items.length} loaded tasks completed`;
  const executionStatusNote = isLessonComplete
    ? "You reached the end of today's lesson loop. Review the finished queue, reopen the wrap-up, or return to Overview for a completed lesson recap."
    : "This page is the active workspace. Use it to execute tasks, change the visible queue, and save progress back into the shared state.";
  const lessonCompleteTitle = isLessonComplete
    ? `You completed all ${state.items.length} tasks in today's lesson`
    : "";
  const lessonCompleteNote =
    lastCompletedItem && isLessonComplete
      ? `${lastCompletedItem.title} closed the loop. Reopen the completed queue if you want a final review pass while the lesson sequence is still fresh.`
      : "All lesson steps are complete. Use the review actions below to revisit the finished flow.";
  const executionDetailKicker = isLessonComplete ? "Lesson Complete" : "Task Detail";
  const executionDetailTitle = isLessonComplete
    ? "Review the completed lesson"
    : selectedExecutionItem?.title ?? currentFocusItem?.title ?? lastCompletedItem?.title ?? "Today's plan is complete";
  const executionDetailSubtitle = isLessonComplete
    ? `Today's lesson is finished. Reopen ${lastCompletedItem?.title ?? "the final task"} for a recap pass or return to Overview to see the lesson marked complete.`
    : selectedExecutionItem?.subtitle ??
      selectedExecutionItem?.recommendedReason ??
      currentFocusItem?.recommendedReason ??
      (lastCompletedItem
        ? `All visible tasks are complete. Reopen ${lastCompletedItem.title} if you want a final review pass.`
        : "Load the lesson queue to start the execution flow.");
  const executionStageValue = isLessonComplete
    ? "Review Mode"
    : selectedExecutionItem?.categoryLabel ?? currentFocusItem?.categoryLabel ?? lastCompletedItem?.categoryLabel ?? "Execution";
  const executionEffortValue = isLessonComplete
    ? `${state.items.length || 0} tasks done`
    : selectedExecutionItem?.durationMinutes
      ? `${selectedExecutionItem.durationMinutes} min`
      : currentFocusItem?.durationMinutes
        ? `${currentFocusItem.durationMinutes} min`
        : lastCompletedItem?.durationMinutes
          ? `${lastCompletedItem.durationMinutes} min`
          : "10 min";

  scheduleRecentCompletionReset(runtime, sync);

  const itemsMarkup = visibleItems
    .map((item, index) => {
      const buttonId = `lesson-toggle-${item.id}`;
      const detailButtonId = `lesson-detail-${item.id}`;
      const isAnimating = state.recentlyCompletedItemId === item.id;
      return `
        <article class="me-lesson-card ${item.completed ? "me-lesson-card-complete" : ""} ${isAnimating ? "me-lesson-card-just-completed" : ""} ${selectedExecutionItem?.id === item.id ? "me-lesson-card-selected" : ""}">
          <div class="me-lesson-meta">
            <span class="me-lesson-index">Task ${index + 1}</span>
            <span class="me-lesson-badge ${item.completed ? "me-lesson-badge-complete" : ""}">${item.completed ? "Completed" : "Today"}</span>
          </div>
          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="me-lesson-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
          <div class="me-lesson-tags">
            ${item.categoryLabel ? `<span class="me-lesson-tag">${escapeHtml(item.categoryLabel)}</span>` : ""}
            ${item.difficultyLabel ? `<span class="me-lesson-tag">${escapeHtml(item.difficultyLabel)}</span>` : ""}
            ${item.durationMinutes ? `<span class="me-lesson-tag">${escapeHtml(String(item.durationMinutes))} min</span>` : ""}
          </div>
          ${
            item.recommendedReason
              ? `<p class="me-lesson-reason">${escapeHtml(item.recommendedReason)}</p>`
              : ""
          }
          <div class="me-lesson-footer">
            <p class="me-lesson-status">${item.completed ? "Saved in your formal study progress state." : "Mark this task complete when you finish it."}</p>
            <div class="me-lesson-actions">
              ${renderButton(detailButtonId, selectedExecutionItem?.id === item.id ? "Focused" : "View Details", selectedExecutionItem?.id === item.id ? "ghost" : "secondary")}
              ${renderButton(buttonId, item.completed ? "Completed" : "Mark Complete", item.completed ? "ghost" : "secondary")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  renderApp(
    root,
    "Today's English Practice",
    runtime,
    "items",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-execution-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Today's Plan</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Complete a few short tasks to build vocabulary, listening, and speaking confidence.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">10 min plan</span>
              <span class="me-chip me-chip-accent">${completedLoadedCount}/${state.items.length || 0} complete</span>
              <span class="me-chip me-chip-warm">${activeFilterLabel}</span>
            </div>
          </div>
          <aside class="me-panel me-execution-panel">
            <p class="me-panel-kicker">Execution note</p>
            <h2 class="me-panel-title">${escapeHtml(executionPanelTitle)}</h2>
            <ul class="me-panel-list">
              ${executionPanelPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </aside>
        </section>

        <section class="me-stat-grid me-execution-stats">
          <article class="me-stat-card">
            <p class="me-stat-value">${state.items.length || 0}</p>
            <p class="me-stat-label">Tasks in the execution queue</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${completedLoadedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Tasks completed in this lesson" : "Tasks completed in this run"}</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${isLessonComplete ? "Review" : remainingLoadedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Queue state" : "Tasks still waiting"}</p>
          </article>
        </section>

        <section class="me-surface me-progress-card me-execution-progress">
          <div class="me-progress-row">
            <div class="me-progress-copy">
              <p class="me-section-kicker">Execution Status</p>
              <h2 class="me-progress-title">${escapeHtml(executionStatusTitle)}</h2>
              <p class="me-progress-note">
                ${escapeHtml(executionStatusNote)}
              </p>
            </div>
            <div class="me-progress-pill">${progressPercent}%</div>
          </div>
          <div class="me-progress-track" aria-hidden="true">
            <span class="me-progress-fill" style="width:${progressPercent}%"></span>
          </div>
          ${
            state.recentlyCompletedItemId && nextRecommendedItem
              ? `<div class="me-empty-state">Next recommended task unlocked: <strong>${escapeHtml(nextRecommendedItem.title)}</strong>. ${escapeHtml(nextRecommendedItem.recommendedReason ?? "Continue while the lesson context is still fresh.")}</div>`
              : ""
          }
          <div class="me-action-group">
            ${state.items.length > 0 && completedLoadedCount < state.items.length ? renderButton("mark-all", "Mark All Loaded Complete", "secondary") : ""}
            ${renderButton("reset-progress", "Reset Progress", "ghost")}
          </div>
        </section>

        ${
          isLessonComplete
            ? `
        <section class="me-surface me-card me-summary-card">
          <p class="me-section-kicker">Lesson Complete</p>
          <h2 class="me-card-title">${escapeHtml(lessonCompleteTitle)}</h2>
          <p class="me-card-subtitle">${escapeHtml(lessonCompleteNote)}</p>
          <div class="me-inline-metrics">
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${completedLoadedCount}</p>
              <p class="me-inline-metric-label">Tasks completed</p>
            </div>
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${escapeHtml(lastCompletedItem?.categoryLabel ?? "Wrap-up")}</p>
              <p class="me-inline-metric-label">Final lesson stage</p>
            </div>
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</p>
              <p class="me-inline-metric-label">Completion saved</p>
            </div>
          </div>
          <div class="me-action-group">
            ${renderButton("lesson-review", "Review Completed Queue", "primary")}
            ${renderButton("lesson-overview", "Back to Overview", "secondary")}
          </div>
        </section>
        `
            : ""
        }

        <section class="me-grid me-grid-columns me-execution-workspace">
          <section class="me-surface me-card me-execution-queue">
            <p class="me-section-kicker">Task Queue</p>
            <h2 class="me-card-title">Execute the visible lesson queue</h2>
            <p class="me-card-subtitle">
              Filter the queue, mark work complete, and keep the execution surface focused on the tasks that matter right now.
            </p>
            <div class="me-filter-row">
              ${renderFilterButton("filter-all", "All", state.activeFilter === "all")}
              ${renderFilterButton("filter-remaining", "Remaining", state.activeFilter === "remaining")}
              ${renderFilterButton("filter-completed", "Completed", state.activeFilter === "completed")}
            </div>
            ${
              state.loading && state.items.length === 0
                ? `<div class="me-empty-state">Loading today's lesson...</div>`
                : ""
            }
            ${
              state.errorText
                ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>`
                : ""
            }
            ${
              !state.loading && visibleItems.length === 0
                ? `<div class="me-empty-state">${state.activeFilter === "completed" ? "No completed tasks yet. Finish one lesson to see it here." : state.activeFilter === "remaining" ? "All loaded tasks are complete. Nice work." : escapeHtml(state.emptyText ?? "No lesson tasks yet.")}</div>`
                : ""
            }
            ${visibleItems.length > 0 ? `<div class="me-lesson-list">${itemsMarkup}</div>` : ""}
          </section>

          <section class="me-surface me-card me-execution-controls">
            <p class="me-section-kicker">${escapeHtml(executionDetailKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(executionDetailTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(executionDetailSubtitle)}
            </p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(executionStageValue)}</p>
                <p class="me-inline-metric-label">Current stage</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(executionEffortValue)}</p>
                <p class="me-inline-metric-label">Suggested effort</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</p>
                <p class="me-inline-metric-label">Last progress save</p>
              </div>
            </div>
            ${
              selectedExecutionItem?.recommendedReason
                ? `<p class="me-lesson-reason">${escapeHtml(selectedExecutionItem.recommendedReason)}</p>`
                : ""
            }
            ${
              selectedExecutionItem
                ? `<ul class="me-detail-list">${buildTaskChecklist(selectedExecutionItem)
                    .map((step) => `<li>${escapeHtml(step)}</li>`)
                    .join("")}</ul>`
                : ""
            }
            <p class="me-detail-note">${escapeHtml(buildTaskOutcome(selectedExecutionItem ?? currentFocusItem ?? lastCompletedItem))}</p>
            ${
              nextRecommendedItem
                ? `<p class="me-lesson-reason">Next up: ${escapeHtml(nextRecommendedItem.title)}. ${escapeHtml(nextRecommendedItem.subtitle ?? "Continue the lesson while the rhythm is still active.")}</p>`
                : ""
            }
            <div class="me-action-group">
              ${selectedExecutionItem && !selectedExecutionItem.completed ? renderButton("focus-complete-continue", "Complete + Continue", "primary") : ""}
              ${isLessonComplete ? renderButton("focus-review-queue", "Review Completed Queue", "secondary") : ""}
              ${isLessonComplete ? renderButton("focus-open-overview", "Back to Overview", "ghost") : ""}
              ${selectedExecutionItem?.completed && nextItemAfterSelection ? renderButton("focus-continue", `Continue to ${nextItemAfterSelection.title}`, "secondary") : ""}
              ${state.hasMore ? renderButton("load-more", state.loading ? "Loading more..." : "Show More Practice", "secondary", state.loading) : ""}
              ${renderButton("settings", "Learning Preferences", selectedExecutionItem && !selectedExecutionItem.completed ? "ghost" : "primary")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "filter-all", () => {
    void runtime.pages.items.setFilter("all").then(sync);
  });
  bindButton(root, "filter-remaining", () => {
    void runtime.pages.items.setFilter("remaining").then(sync);
  });
  bindButton(root, "filter-completed", () => {
    void runtime.pages.items.setFilter("completed").then(sync);
  });
  bindButton(root, "load-more", () => {
    void runtime.pages.items.loadMore().then(sync);
  });
  bindButton(root, "mark-all", () => {
    void runtime.pages.items.markItemsComplete(state.items.map((item) => item.id)).then(sync);
  });
  bindButton(root, "focus-complete-continue", () => {
    if (!selectedExecutionItem) {
      return;
    }

    void runtime.pages.items.completeItemAndContinue(selectedExecutionItem.id).then(sync);
  });
  bindButton(root, "focus-continue", () => {
    if (!nextItemAfterSelection) {
      return;
    }

    void runtime.pages.items.setSelectedItem(nextItemAfterSelection.id).then(sync);
  });
  bindButton(root, "lesson-review", () => {
    if (!lastCompletedItem) {
      return;
    }

    void runtime.pages.items.setFilter("completed").then(() => {
      void runtime.pages.items.setSelectedItem(lastCompletedItem.id).then(sync);
    });
  });
  bindButton(root, "lesson-overview", () => {
    void runtime.pages.items.goToOverview().then(sync);
  });
  bindButton(root, "focus-review-queue", () => {
    if (!lastCompletedItem) {
      return;
    }

    void runtime.pages.items.setFilter("completed").then(() => {
      void runtime.pages.items.setSelectedItem(lastCompletedItem.id).then(sync);
    });
  });
  bindButton(root, "focus-open-overview", () => {
    void runtime.pages.items.goToOverview().then(sync);
  });
  bindButton(root, "reset-progress", () => {
    void runtime.pages.items.clearProgress().then(sync);
  });
  visibleItems.forEach((item) => {
    bindButton(root, `lesson-detail-${item.id}`, () => {
      void runtime.pages.items.setSelectedItem(item.id).then(sync);
    });
    bindButton(root, `lesson-toggle-${item.id}`, () => {
      void runtime.pages.items.toggleItemCompletion(item.id).then(sync);
    });
  });
  bindButton(root, "settings", () => {
    void runtime.pages.items.goToSettings().then(sync);
  });
}



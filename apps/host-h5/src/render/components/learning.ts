import type { ItemsFilterValue, ItemsPageItem } from "@minix/feature-items";

import type { HostH5Runtime } from "../../manifest/app.manifest";

let completionAnimationTimer: number | null = null;

export function filterItems(items: ItemsPageItem[], activeFilter: ItemsFilterValue): ItemsPageItem[] {
  switch (activeFilter) {
    case "completed":
      return items.filter((item) => item.completed);
    case "remaining":
      return items.filter((item) => !item.completed);
    default:
      return items;
  }
}

export function findCurrentFocusItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return items.find((item) => !item.completed) ?? items[0];
}

export function findLastCompletedItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return [...items].reverse().find((item) => item.completed);
}

export function buildResumeTaskLabel(task: ItemsPageItem | undefined, completedCount: number, remainingCount: number): string {
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

export function buildResumeTaskDescription(
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

export function resolveSelectedExecutionItem(items: ItemsPageItem[], selectedItemId?: string): ItemsPageItem | undefined {
  return items.find((item) => item.id === selectedItemId) ?? findCurrentFocusItem(items) ?? items[0];
}

export function buildTaskChecklist(task: ItemsPageItem | undefined): string[] {
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

export function buildTaskOutcome(task: ItemsPageItem | undefined): string {
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

export function scheduleRecentCompletionReset(runtime: HostH5Runtime, sync: () => void) {
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


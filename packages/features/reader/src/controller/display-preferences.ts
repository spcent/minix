import type { ReaderDisplayPreferences } from "@minix/core";

import type { ReaderState } from "../model";

export const READER_THEMES: ReaderState["theme"][] = ["paper", "sepia", "night"];
export const READER_MODES: ReaderState["mode"][] = ["scroll", "page"];

export function createDisplayPreferences(state: ReaderState): ReaderDisplayPreferences {
  return {
    theme: state.theme,
    mode: state.mode,
    fontScale: state.fontScale,
    nightModeDefault: state.nightModeDefault,
  };
}

export function applyDisplayPreferences(
  state: ReaderState,
  preferences: ReaderDisplayPreferences | null,
): Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault"> {
  return {
    theme: preferences?.theme ?? state.theme,
    mode: preferences?.mode ?? state.mode,
    fontScale: preferences?.fontScale ?? state.fontScale,
    nightModeDefault: preferences?.nightModeDefault ?? state.nightModeDefault,
  };
}

function isDuskReadingWindow(currentTime: Date): boolean {
  const hour = currentTime.getHours();
  return hour >= 20 || hour < 6;
}

export function applyNightModeDefault(
  displayState: Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault">,
  currentTime: Date,
): Pick<ReaderState, "theme" | "mode" | "fontScale" | "nightModeDefault"> {
  if (displayState.nightModeDefault === "always-night") {
    return {
      ...displayState,
      theme: "night",
    };
  }

  if (displayState.nightModeDefault === "after-dusk" && isDuskReadingWindow(currentTime)) {
    return {
      ...displayState,
      theme: "night",
    };
  }

  return displayState;
}

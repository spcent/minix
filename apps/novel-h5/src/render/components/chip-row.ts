import { escapeHtml } from "../utils";

export type ChipLabel = string | number | false | null | undefined;

function isRenderableChipLabel(label: ChipLabel): label is string | number {
  return label !== false && label !== null && label !== undefined && String(label).length > 0;
}

export function renderChip(label: string | number): string {
  return `<span class="nh-chip">${escapeHtml(String(label))}</span>`;
}

export function renderChipRow(labels: readonly ChipLabel[]): string {
  const chips = labels.filter(isRenderableChipLabel);
  if (chips.length === 0) {
    return "";
  }

  return `<div class="nh-chip-row">${chips.map(renderChip).join("")}</div>`;
}

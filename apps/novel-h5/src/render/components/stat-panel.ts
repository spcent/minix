import { escapeHtml } from "../utils";

export interface StatPanelOptions {
  label: string;
  value: string | number;
  note?: string;
}

export function renderStatPanel(options: StatPanelOptions): string {
  return `
    <article class="nh-stat-panel">
      <p class="nh-meta-label">${escapeHtml(options.label)}</p>
      <p class="nh-stat-value">${escapeHtml(String(options.value))}</p>
      ${options.note ? `<p class="nh-item-copy">${escapeHtml(options.note)}</p>` : ""}
    </article>
  `;
}

export function renderStatPanels(items: readonly StatPanelOptions[]): string {
  return items.map(renderStatPanel).join("");
}

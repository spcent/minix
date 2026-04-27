import { renderActionRow, type RenderableAction } from "./action-row";
import { escapeHtml } from "../utils";

export interface InfoPanelOptions {
  label: string;
  copy?: string | number | boolean | null | undefined;
  title?: string | number | boolean | null | undefined;
  className?: "nh-panel" | "nh-panel nh-issue-panel";
  actions?: readonly RenderableAction[];
}

export function renderInfoPanel(options: InfoPanelOptions): string {
  const className = options.className ?? "nh-panel";
  const title = options.title !== undefined && options.title !== null
    ? `<h3 class="nh-item-title">${escapeHtml(String(options.title))}</h3>`
    : "";
  const copy = options.copy !== undefined && options.copy !== null
    ? `<p class="nh-item-copy">${escapeHtml(String(options.copy))}</p>`
    : "";

  return `
    <article class="${className}">
      <p class="nh-meta-label">${escapeHtml(options.label)}</p>
      ${title}
      ${copy}
      ${renderActionRow(options.actions ?? [])}
    </article>
  `;
}

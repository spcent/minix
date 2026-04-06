import { escapeHtml } from "../utils";

export function renderSectionHeading(options: {
  kicker: string;
  title: string;
  copy?: string;
  aside?: string;
  compact?: boolean;
}): string {
  return `
    <div class="nh-section-head${options.compact ? " nh-section-head-compact" : ""}">
      <div class="nh-grid">
        <div class="nh-kicker">${escapeHtml(options.kicker)}</div>
        <h2 class="nh-title-small">${escapeHtml(options.title)}</h2>
        ${options.copy ? `<p class="nh-copy">${escapeHtml(options.copy)}</p>` : ""}
      </div>
      ${options.aside ? `<div class="nh-section-head-aside">${options.aside}</div>` : ""}
    </div>
  `;
}

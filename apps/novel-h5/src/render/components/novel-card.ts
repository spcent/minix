import type { NovelCard } from "@minix/contracts";

import { escapeHtml, formatCompactNumber, formatDate, renderActionButton } from "../utils";

type ButtonConfig = {
  label: string;
  action: string;
  value?: string | number;
  variant?: "primary" | "secondary" | "ghost";
};

export function renderNovelCard(
  item: NovelCard,
  options: {
    active?: boolean;
    variant?: "feature" | "compact";
    primary?: ButtonConfig;
    secondary?: ButtonConfig;
    highlight?: string;
  } = {},
): string {
  const classes = [
    "nh-item",
    options.variant === "compact" ? "nh-item-compact" : "nh-item-feature",
    options.active ? "nh-item-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const badges = [
    item.categoryLabel,
    item.status,
    item.requiresMembership ? "Membership" : item.isTrial ? "Trial" : "Open",
  ];

  return `
    <article class="${classes}">
      <div class="nh-item-cover">
        <div class="nh-item-cover-mark">${escapeHtml(item.categoryLabel)}</div>
        <div class="nh-item-cover-title">${escapeHtml(item.title)}</div>
      </div>
      <div class="nh-grid">
        ${options.highlight ? `<p class="nh-item-highlight">${escapeHtml(options.highlight)}</p>` : ""}
        <div class="nh-chip-row">
          ${badges.map((badge) => `<span class="nh-chip">${escapeHtml(badge)}</span>`).join("")}
        </div>
        <div class="nh-grid">
          <h3 class="nh-item-title">${escapeHtml(item.title)}</h3>
          <p class="nh-item-subtitle">${escapeHtml(item.authorName)}</p>
          <p class="nh-item-copy">${escapeHtml(item.summary)}</p>
        </div>
        <div class="nh-item-metadata">
          <span>${escapeHtml(item.latestChapterTitle ?? "Fresh chapters soon")}</span>
          <span>${escapeHtml(formatDate(item.updatedAt))}</span>
        </div>
        <div class="nh-item-metadata">
          <span>${formatCompactNumber(item.wordCount)} words</span>
          <span>${formatCompactNumber(item.readingCount)} readers</span>
          <span>${formatCompactNumber(item.bookshelfCount)} shelves</span>
        </div>
        ${
          options.primary || options.secondary
            ? `<div class="nh-actions">
              ${options.primary ? renderActionButton(options.primary.label, "controller", options.primary.action, options.primary.value, options.primary.variant ?? "primary") : ""}
              ${options.secondary ? renderActionButton(options.secondary.label, "controller", options.secondary.action, options.secondary.value, options.secondary.variant ?? "ghost") : ""}
            </div>`
            : ""
        }
      </div>
    </article>
  `;
}

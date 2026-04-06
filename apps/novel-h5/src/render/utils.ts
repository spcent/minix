import { NOVEL_H5_ROUTES } from "../manifest/routes";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(value?: string): string {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatCompactNumber(value?: number): string {
  if (typeof value !== "number") {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function splitParagraphs(content?: string): [string[], string[]] {
  const paragraphs =
    content
      ?.split("\n\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0) ?? [];

  if (paragraphs.length <= 1) {
    return [paragraphs, []];
  }

  const midpoint = Math.ceil(paragraphs.length / 2);
  return [paragraphs.slice(0, midpoint), paragraphs.slice(midpoint)];
}

export function renderParagraphs(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => `<p class="nh-copy nh-reader-paragraph">${escapeHtml(paragraph)}</p>`).join("");
}

export function renderActionButton(
  label: string,
  target: "entry" | "controller",
  action: string,
  value?: string | number,
  variant: "primary" | "secondary" | "ghost" = "secondary",
): string {
  const className =
    variant === "primary"
      ? "nh-button"
      : variant === "ghost"
        ? "nh-button nh-button-ghost"
        : "nh-button nh-button-secondary";

  return `<button class="${className}" data-target="${target}" data-action="${action}"${
    value !== undefined ? ` data-value="${escapeHtml(String(value))}"` : ""
  }>${escapeHtml(label)}</button>`;
}

export function renderRouteLink(
  label: string,
  routePath: string,
  variant: "nav" | "button" | "ghost" = "nav",
): string {
  const className =
    variant === "button"
      ? "nh-button nh-button-secondary"
      : variant === "ghost"
        ? "nh-button nh-button-ghost"
        : "nh-nav-link";

  return `<a class="${className}" href="${escapeHtml(routePath)}" data-route-path="${escapeHtml(routePath)}">${escapeHtml(label)}</a>`;
}

export function routePath(routeKey: keyof typeof NOVEL_H5_ROUTES): string {
  return NOVEL_H5_ROUTES[routeKey];
}

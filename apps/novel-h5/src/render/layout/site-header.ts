import type { NovelH5PageKey } from "../types";
import { renderRouteLink, routePath } from "../utils";

export function renderSiteHeader(activePage: NovelH5PageKey): string {
  const navItems: Array<{ key: NovelH5PageKey; label: string }> = [
    { key: "home", label: "Home" },
    { key: "catalog", label: "Library" },
    { key: "feed", label: "Discover" },
    { key: "account", label: "Account" },
    { key: "messages", label: "Inbox" },
    { key: "bookshelf", label: "Shelf" },
    { key: "membership", label: "Membership" },
    { key: "feedback", label: "Support" },
    { key: "settings", label: "Preferences" },
  ];

  return `
    <header class="nh-site-header">
      <div class="nh-brand">
        <div class="nh-brand-mark">Novel H5</div>
        <div class="nh-brand-title">Birdor Fiction</div>
      </div>
      <nav class="nh-nav">
        ${navItems
          .map(({ key, label }) => {
            const className = key === activePage ? "nh-nav-link nh-nav-link-active" : "nh-nav-link";
            return `<a class="${className}" href="${routePath(key)}" data-route-path="${routePath(key)}">${label}</a>`;
          })
          .join("")}
        ${renderRouteLink("Sign In", routePath("login"), "ghost")}
      </nav>
    </header>
  `;
}

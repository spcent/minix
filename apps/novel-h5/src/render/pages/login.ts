import type { AuthPageState } from "@minix/feature-auth";

import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderLoginPage(state: AuthPageState): string {
  return renderAppShell(
    "login",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid">
          <div class="nh-kicker">Guest-first entry</div>
          <h1 class="nh-title">Step into the library without losing the reading flow.</h1>
          <p class="nh-copy">
            Login is now a supporting entry instead of the entire homepage. Guests can browse, preview, and read trial chapters first,
            then sign in when they want shelf sync, membership, or device continuity.
          </p>
          ${state.noticeMessage ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.noticeMessage)}</p></div>` : ""}
          ${state.errorMessage ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.errorMessage)}</p></div>` : ""}
          <div class="nh-actions">
            ${renderActionButton(state.loading ? "Signing in..." : "Sign in", "entry", "onTapLogin", undefined, "primary")}
            ${renderRouteLink("Continue as guest", routePath("home"), "button")}
            ${renderRouteLink("Browse library", routePath("catalog"), "ghost")}
          </div>
        </div>
        <aside class="nh-cover">
          <p class="nh-cover-kicker">Reading continuity</p>
          <h2 class="nh-cover-title">Shelf sync, membership access, and calm re-entry.</h2>
          <p class="nh-cover-copy">
            Use sign-in when the product needs identity. Do not force it before discovery.
          </p>
        </aside>
      </section>
    `,
  );
}

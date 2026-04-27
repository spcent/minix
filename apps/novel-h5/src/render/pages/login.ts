import type { AuthPageState } from "@minix/feature-auth";

import { renderActionRow } from "../components/action-row";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderLoginPage(state: AuthPageState): string {
  const phoneDescriptor = state.loginMethodDescriptors.find((descriptor) => descriptor.method === "phone_code");
  const oauthDescriptor = state.loginMethodDescriptors.find((descriptor) => descriptor.method === "oauth");

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
          ${renderActionRow([
            renderActionButton(state.loading ? "Signing in..." : "Sign in", "entry", "onTapLogin", undefined, "primary"),
            renderRouteLink("Continue as guest", routePath("home"), "button"),
            renderRouteLink("Browse library", routePath("catalog"), "ghost"),
          ])}
        </div>
        <aside class="nh-cover">
          <p class="nh-cover-kicker">Reading continuity</p>
          <h2 class="nh-cover-title">Shelf sync, membership access, and calm re-entry.</h2>
          <p class="nh-cover-copy">
            Use sign-in when the product needs identity. Do not force it before discovery.
          </p>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          <div class="nh-kicker">Provider posture</div>
          <h2 class="nh-item-title">SMS and OAuth stay explicit about operator-owned setup.</h2>
          <p class="nh-item-copy">${escapeHtml(phoneDescriptor?.summary ?? "Phone verification remains provider-backed.")}</p>
          <p class="nh-item-copy">${escapeHtml(oauthDescriptor?.summary ?? "OAuth remains provider-backed.")}</p>
        </section>
        <aside class="nh-card">
          <div class="nh-kicker">Recovery and callback</div>
          <p class="nh-item-copy">${escapeHtml(state.phoneVerification?.message ?? phoneDescriptor?.recoverySummary ?? "Verification-code recovery stays on the current login surface.")}</p>
          <p class="nh-item-copy">${escapeHtml(state.oauthAuthorization?.message ?? oauthDescriptor?.recoverySummary ?? "OAuth callback returns to the current login or bind page.")}</p>
          ${state.oauthAuthorization ? `<p class="nh-item-copy">${escapeHtml(`Active OAuth state: ${state.oauthAuthorization.state}`)}</p>` : ""}
        </aside>
      </section>
    `,
  );
}

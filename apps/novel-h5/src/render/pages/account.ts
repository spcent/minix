import type { AccountState } from "@minix/feature-account";

import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderAccountPage(state: AccountState): string {
  const identitySection = state.sections.find((section) => section.key === "identity") ?? state.sections[0];
  const sessionSection = state.sections.find((section) => section.key === "session") ?? state.sections[1];

  return renderAppShell(
    "account",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Reader account</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.subtitle)}</p>
          <div class="nh-stat-strip">
            ${
              state.stats.length > 0
                ? state.stats
                    .slice(0, 3)
                    .map(
                      (stat) => `
                        <article class="nh-stat-panel">
                          <p class="nh-meta-label">${escapeHtml(stat.label)}</p>
                          <p class="nh-stat-value">${escapeHtml(stat.value)}</p>
                          <p class="nh-item-copy">${escapeHtml(stat.tone ?? "neutral")}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `
                  <article class="nh-stat-panel">
                    <p class="nh-meta-label">State</p>
                    <p class="nh-stat-value">--</p>
                    <p class="nh-item-copy">Account data will appear after the shared controller finishes hydrating.</p>
                  </article>
                `
            }
          </div>
          <div class="nh-actions">
            ${renderActionButton("Refresh account", "entry", "onShow", undefined, "primary")}
            ${renderActionButton("Copy user id", "controller", "copyUserId", undefined, "secondary")}
            ${renderActionButton("Open preferences", "controller", "goToSettings", undefined, "secondary")}
            ${renderActionButton("Back home", "controller", "goToOverview", undefined, "ghost")}
          </div>
          ${state.copyFeedback ? `<p class="nh-item-copy">${escapeHtml(state.copyFeedback)}</p>` : ""}
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Identity</p>
            <h2 class="nh-cover-title">${escapeHtml(state.nickname ?? "Guest reader")}</h2>
            <p class="nh-cover-copy">${escapeHtml(state.authStatusLabel ?? state.sessionLabel ?? "Shared account posture is attached to the reader session here.")}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Workflow posture</p>
            <p class="nh-item-copy">
              ${escapeHtml(
                state.identityWorkflows?.canBindPhone
                  ? "Phone binding is still available if the novel host needs to lift a weaker identity into a stronger recovery state."
                  : "Identity upgrades are quiet right now, which means the current reader session is already stable enough for ordinary reading and support recovery.",
              )}
            </p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Shared output",
            title: identitySection?.title ?? "Identity",
            copy: "The novel host now exposes the same shared account summary instead of forcing recovery and profile inspection back into another host.",
          })}
          <div class="nh-section-grid">
            ${(identitySection?.items ?? [])
              .map(
                (item) => `
                  <article class="nh-item">
                    <div class="nh-kicker">${escapeHtml(item.label)}</div>
                    <h2 class="nh-item-title">${escapeHtml(String(item.value ?? "Not set"))}</h2>
                    ${item.hint ? `<p class="nh-item-copy">${escapeHtml(item.hint)}</p>` : ""}
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Session",
            title: sessionSection?.title ?? "Session posture",
            copy: "Support and recovery context stay close to reading preferences so cross-host continuity can be explained in one place.",
            compact: true,
          })}
          <div class="nh-grid">
            ${(sessionSection?.items ?? [])
              .map(
                (item) => `
                  <article class="nh-panel">
                    <p class="nh-meta-label">${escapeHtml(item.label)}</p>
                    <p class="nh-item-copy">${escapeHtml(String(item.value ?? "Not set"))}</p>
                  </article>
                `,
              )
              .join("")}
            <article class="nh-panel">
              <p class="nh-meta-label">Next stop</p>
              <p class="nh-item-copy">Use Account for identity and recovery posture, then return to Preferences, Discover, or the active title without changing hosts.</p>
              <div class="nh-actions">
                ${renderRouteLink("Open support", routePath("feedback"), "button")}
                ${renderRouteLink("Reader tools", routePath("mediaTools"), "ghost")}
              </div>
            </article>
          </div>
        </aside>
      </section>
    `,
  );
}

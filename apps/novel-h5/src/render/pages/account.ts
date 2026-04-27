import type { AccountState } from "@minix/feature-account";

import { renderActionRow } from "../components/action-row";
import { renderInfoPanel } from "../components/info-panel";
import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
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
                ? renderStatPanels(
                    state.stats.slice(0, 3).map((stat) => ({
                      label: stat.label,
                      value: stat.value,
                      note: stat.tone ?? "neutral",
                    })),
                  )
                : renderStatPanels([
                    {
                      label: "State",
                      value: "--",
                      note: "Account data will appear after the shared controller finishes hydrating.",
                    },
                  ])
            }
          </div>
          ${renderActionRow([
            renderActionButton("Refresh account", "entry", "onShow", undefined, "primary"),
            renderActionButton("Copy user id", "controller", "copyUserId", undefined, "secondary"),
            renderActionButton("Open preferences", "controller", "goToSettings", undefined, "secondary"),
            renderActionButton("Back home", "controller", "goToOverview", undefined, "ghost"),
          ])}
          ${state.copyFeedback ? `<p class="nh-item-copy">${escapeHtml(state.copyFeedback)}</p>` : ""}
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Identity</p>
            <h2 class="nh-cover-title">${escapeHtml(state.nickname ?? "Guest reader")}</h2>
            <p class="nh-cover-copy">${escapeHtml(state.authStatusLabel ?? state.sessionLabel ?? "Shared account posture is attached to the reader session here.")}</p>
          </div>
          ${renderInfoPanel({
            label: "Workflow posture",
            copy: state.identityWorkflows?.canBindPhone
              ? "Phone binding is still available if the novel host needs to lift a weaker identity into a stronger recovery state."
              : "Identity upgrades are quiet right now, which means the current reader session is already stable enough for ordinary reading and support recovery.",
            className: "nh-panel nh-issue-panel",
          })}
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
                  ${renderInfoPanel({
                    label: item.label,
                    copy: String(item.value ?? "Not set"),
                  })}
                `,
              )
              .join("")}
            ${renderInfoPanel({
              label: "Next stop",
              copy: "Use Account for identity and recovery posture, then return to Preferences, Discover, or the active title without changing hosts.",
              actions: [
                renderRouteLink("Open support", routePath("feedback"), "button"),
                renderRouteLink("Reader tools", routePath("mediaTools"), "ghost"),
              ],
            })}
          </div>
        </aside>
      </section>
    `,
  );
}

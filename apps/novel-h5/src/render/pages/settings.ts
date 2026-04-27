import type { SettingsPageModel } from "@minix/core";

import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton } from "../utils";

export function renderSettingsPage(state: SettingsPageModel): string {
  const readingProfile = state.sections.find((section) => section.key === "reading-profile") ?? state.sections[0];
  const displayDefaults = state.sections.find((section) => section.key === "display-defaults");
  const continuity = state.sections.find((section) => section.key === "continuity");
  const account = state.sections.find((section) => section.key === "account");
  const membershipRhythm = readingProfile?.items.find((item) => item.key === "membership")?.value;
  const sessionGoal = readingProfile?.items.find((item) => item.key === "session-goal")?.value;
  const digestValue = continuity?.items.find((item) => item.key === "digest")?.value;
  const reminderValue = continuity?.items.find((item) => item.key === "reminders")?.value;
  const syncValue = account?.items.find((item) => item.key === "sync")?.value;
  const supportingSections = state.sections.filter(
    (section) => !["reading-profile", "display-defaults", "continuity", "account"].includes(section.key),
  );
  const totalItems = state.sections.reduce((count, section) => count + section.items.length, 0);

  return renderAppShell(
    "settings",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Reading center</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">A real novel reading center should read like a calm operational profile: how the reader prefers to consume chapters, how continuity works, and what account state the session is carrying.</p>
          <div class="nh-stat-strip">
            ${renderStatPanels([
              {
                label: "Sections",
                value: String(state.sections.length).padStart(2, "0"),
                note: "Configured reading-center groups",
              },
              {
                label: "Preference items",
                value: String(totalItems).padStart(2, "0"),
                note: "Display, continuity, reminder, and account controls",
              },
              {
                label: "Primary area",
                value: readingProfile?.title ?? readingProfile?.key ?? "general",
                note: "Current reading profile focus",
              },
            ])}
          </div>
          <div class="nh-actions">
            ${renderActionButton("Back home", "entry", "onTapOverview", undefined, "secondary")}
            ${renderActionButton("Open discover", "entry", "onTapDiscover", undefined, "secondary")}
            ${renderActionButton("Open account", "entry", "onTapAccount", undefined, "secondary")}
            ${renderActionButton("Open inbox", "entry", "onTapInbox", undefined, "secondary")}
            ${renderActionButton("Support", "entry", "onTapFeedback", undefined, "secondary")}
            ${renderActionButton("Media tools", "entry", "onTapMediaTools", undefined, "ghost")}
            ${renderActionButton("Back to reader", "entry", "onTapReader", undefined, "secondary")}
            ${renderActionButton("Open shelf", "entry", "onTapPlan", undefined, "ghost")}
            ${renderActionButton("Sign out", "entry", "onTapLogout", undefined, "primary")}
          </div>
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Reading profile</p>
            <h2 class="nh-cover-title">${escapeHtml(readingProfile?.items[0]?.value ? String(readingProfile.items[0].value) : "Quiet defaults for a long-form product.")}</h2>
            <p class="nh-cover-copy">${escapeHtml(readingProfile?.items[1]?.value ? String(readingProfile.items[1].value) : "Typography, continuity, digest posture, and account state should read like one coherent reading-center story.")}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Reading intent</p>
            <p class="nh-item-copy">Reading Center should now behave like a retention layer: calmer defaults, clearer continuity, and fewer reasons for the reader to lose momentum between sessions.</p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Retention posture",
            title: "Keep premium reading calm between sessions.",
            copy: "A long-form product should explain how it stays useful after the first unlock or first chapter finish.",
          })}
          <div class="nh-section-grid">
            <article class="nh-item">
              <div class="nh-kicker">Membership rhythm</div>
              <h2 class="nh-item-title">Commitment without repeat interruption</h2>
              <p class="nh-item-copy">${escapeHtml(String(membershipRhythm ?? "Premium continuity should feel ambient once active."))}</p>
            </article>
            <article class="nh-item">
              <div class="nh-kicker">Session target</div>
              <h2 class="nh-item-title">A realistic cadence keeps the reader returning</h2>
              <p class="nh-item-copy">${escapeHtml(String(sessionGoal ?? "Keep one active title warm instead of turning the product into a backlog tracker."))}</p>
            </article>
            <article class="nh-item">
              <div class="nh-kicker">Digest and reminder posture</div>
              <h2 class="nh-item-title">Signals should be quiet, not noisy</h2>
              <p class="nh-item-copy">${escapeHtml(`${String(digestValue ?? "Digest posture not set.")} · ${String(reminderValue ?? "Reminder posture not set.")}`)}</p>
            </article>
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Cross-host continuity",
            title: "The reading center should promise a stable return path.",
            copy: "Settings are part of product trust, not just interface control.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Sync posture</p>
              <p class="nh-item-copy">${escapeHtml(String(syncValue ?? "Progress and shelf state should stay portable across reading surfaces."))}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Return promise</p>
              <p class="nh-item-copy">When the reader leaves for detail, shelf, or membership, this surface should still make the way back feel predictable.</p>
            </article>
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Reading profile",
            title: readingProfile?.title ?? readingProfile?.key ?? "Reading preferences",
            copy: "Lead with the reading identity and current habit, not the account edge cases.",
          })}
          <div class="nh-section-grid">
            ${(readingProfile?.items ?? [])
              .map(
                (item) => `
                  <article class="nh-item">
                    <div class="nh-kicker">${escapeHtml(item.type)}</div>
                    <h2 class="nh-item-title">${escapeHtml(item.label)}</h2>
                    <p class="nh-item-copy">${escapeHtml(String(item.value ?? "Not set"))}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Display defaults",
            title: displayDefaults?.title ?? "Display defaults",
            copy: "Reader presentation settings should sit close to profile, because visual comfort changes reading behavior directly.",
          })}
          <div class="nh-grid">
            ${(displayDefaults?.items ?? [])
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
              <p class="nh-meta-label">Reader controls</p>
              <p class="nh-item-copy">These controls now write to the same stored display preferences that the reader hydrates on load, including the night-mode default used for late reading sessions.</p>
              <div class="nh-actions">
                ${renderActionButton("A-", "controller", "decreaseReaderFontScale", undefined, "ghost")}
                ${renderActionButton("A+", "controller", "increaseReaderFontScale", undefined, "ghost")}
                ${renderActionButton("Cycle theme", "controller", "cycleReaderTheme", undefined, "secondary")}
                ${renderActionButton("Cycle mode", "controller", "cycleReaderMode", undefined, "secondary")}
                ${renderActionButton("Night default", "entry", "onTapCycleNightModeDefault", undefined, "secondary")}
                ${renderActionButton("Apply and return", "entry", "onTapApplyReader", undefined, "primary")}
                ${renderActionButton("Back to reader", "entry", "onTapReader", undefined, "ghost")}
              </div>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Reading center controls</p>
              <p class="nh-item-copy">Continuity, reminders, digest cadence, sync posture, and shelf order now live here as stored reading-center preferences instead of static copy.</p>
              <div class="nh-actions">
                ${renderActionButton("Cycle resume mode", "entry", "onTapCycleResumeMode", undefined, "secondary")}
                ${renderActionButton("Cycle shelf order", "entry", "onTapCycleShelfOrder", undefined, "secondary")}
                ${renderActionButton("Cycle reminders", "entry", "onTapCycleReminderMode", undefined, "secondary")}
                ${renderActionButton("Cycle digest", "entry", "onTapCycleDigestMode", undefined, "secondary")}
                ${renderActionButton("Cycle sync", "entry", "onTapCycleSyncMode", undefined, "secondary")}
              </div>
            </article>
          </div>
        </aside>
      </section>
      ${
        continuity || account
          ? `
            <section class="nh-sidebar-grid">
              ${
                continuity
                  ? `
                    <section class="nh-card">
                      ${renderSectionHeading({
                        kicker: "Continuity",
                        title: continuity.title ?? "Continuity",
                        copy: "Continuation logic belongs here: resume point, shelf priority, and release digest behavior.",
                      })}
                      <div class="nh-section-grid">
                        ${continuity.items
                          .map(
                            (item) => `
                              <article class="nh-item">
                                <div class="nh-kicker">${escapeHtml(item.type)}</div>
                                <h2 class="nh-item-title">${escapeHtml(item.label)}</h2>
                                <p class="nh-item-copy">${escapeHtml(String(item.value ?? "Not set"))}</p>
                              </article>
                            `,
                          )
                          .join("")}
                      </div>
                    </section>
                  `
                  : ""
              }
              ${
                account
                  ? `
                    <aside class="nh-card">
                      ${renderSectionHeading({
                        kicker: "Account actions",
                        title: account.title ?? "Account",
                        copy: "Keep session status and sign-out nearby without letting the page collapse into an account-only surface.",
                      })}
                      <div class="nh-grid">
                        ${account.items
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
                          <p class="nh-meta-label">Quick navigation</p>
                          <p class="nh-item-copy">Settings should support return to discovery and active reading faster than browser back controls.</p>
                          <div class="nh-actions">
                            ${renderActionButton("Home", "entry", "onTapOverview", undefined, "secondary")}
                            ${renderActionButton("Reader", "entry", "onTapReader", undefined, "secondary")}
                            ${renderActionButton("Shelf", "entry", "onTapPlan", undefined, "ghost")}
                            ${renderActionButton("Sign out", "entry", "onTapLogout", undefined, "primary")}
                          </div>
                        </article>
                      </div>
                    </aside>
                  `
                  : ""
              }
            </section>
          `
          : ""
      }
      ${
        supportingSections.length > 0
          ? `
            <section class="nh-card">
              ${renderSectionHeading({
                kicker: "Additional sections",
                title: "Secondary preference groups still need a clear grid.",
                copy: "Do not bury supporting settings in undifferentiated text rows.",
              })}
              <div class="nh-grid">
                ${supportingSections
                  .map(
                    (section) => `
                      <section class="nh-panel">
                        <div class="nh-grid">
                          <div class="nh-kicker">${escapeHtml(section.title ?? section.key)}</div>
                          <div class="nh-section-grid">
                            ${section.items
                              .map(
                                (item) => `
                                  <article class="nh-item">
                                    <div class="nh-kicker">${escapeHtml(item.type)}</div>
                                    <h3 class="nh-item-title">${escapeHtml(item.label)}</h3>
                                    <p class="nh-item-copy">${escapeHtml(String(item.value ?? "Not set"))}</p>
                                  </article>
                                `,
                              )
                              .join("")}
                          </div>
                        </div>
                      </section>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    `,
  );
}

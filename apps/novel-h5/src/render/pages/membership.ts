import type { SubscriptionState } from "@minix/feature-subscription";

import type { NovelH5PageRenderContext } from "../types";
import { renderSectionHeading } from "../components/section-heading";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton } from "../utils";

export function renderMembershipPage(context: NovelH5PageRenderContext, state: SubscriptionState): string {
  const benefits = state.benefits.length > 0 ? state.benefits : state.overview?.benefits ?? [];
  const isUnlocked = Boolean(state.overview?.active);
  const sourceLabel = state.source ?? "direct";
  const continueLabel =
    state.returnActionLabel ??
    (state.source === "reader"
      ? "Return to chapter"
      : state.source === "detail"
        ? "Return to title"
        : "Back to library");
  const recommendedPlanId =
    state.recommendedPlanId ?? (isUnlocked ? state.lastPurchasedPlanId ?? "quarterly" : state.source === "reader" ? "monthly" : "quarterly");
  const unlockOutcomeLabel =
    state.unlockOutcomeLabel ??
    (state.source === "reader"
      ? "Unlock now and resume the blocked chapter without losing your place."
      : state.source === "detail"
        ? "Unlock the premium title from the detail page and continue with full access already resolved."
        : "Unlock the premium catalog, shelf continuity, and cleaner return paths across the site.");
  const returnContextLabel =
    state.returnContextLabel ??
    (state.source === "reader"
      ? "Return path will reopen the blocked reader location."
      : state.source === "detail"
        ? "Return path will reopen the blocked title dossier."
        : "Return path will land back in the library with premium continuity already active.");
  const recommendationLogic =
    recommendedPlanId === "monthly"
      ? "Monthly is recommended when the reader hit the wall in the middle of a single active reading session and wants the lightest commitment."
      : recommendedPlanId === "annual"
        ? "Annual works best when premium reading is a steady habit and renewal friction should disappear."
        : "Quarterly is the default because it balances lower commitment with enough runway for serial reading continuity.";
  const planComparison = [
    {
      label: "Unlock speed",
      monthly: "Immediate",
      quarterly: "Immediate",
      annual: "Immediate",
    },
    {
      label: "Best for",
      monthly: "One active serial",
      quarterly: "2 to 3 ongoing titles",
      annual: "Deep library reading",
    },
    {
      label: "Return flow",
      monthly: "Fastest chapter recovery",
      quarterly: "Best continuity value",
      annual: "Lowest renewal friction",
    },
  ];
  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      price: "¥28",
      cadence: "per month",
      note: "Best for one active serial and short premium bursts.",
      accent: false,
      savings: "Flexible reset point",
      highlight: "Start reading again today",
      checkpoints: [
        "Instant access to locked and trial chapters",
        "Fastest option if you only track one title at a time",
        "Keeps recent-reading recovery active across shelf and reader",
      ],
    },
    {
      id: "quarterly",
      name: "Quarterly",
      price: "¥68",
      cadence: "every 3 months",
      note: "Best balance for readers following multiple ongoing stories.",
      accent: true,
      savings: "Recommended plan",
      highlight: "Lower cost than renewing monthly",
      checkpoints: [
        "Built for serial readers who bounce between catalog, detail, and reader",
        "Stronger value if you keep a live bookshelf with multiple active titles",
        "Best default if you want continuity without thinking about renewal too often",
      ],
    },
    {
      id: "annual",
      name: "Annual",
      price: "¥228",
      cadence: "per year",
      note: "Best for full-library reading and the lowest renewal friction.",
      accent: false,
      savings: "Best long-term rate",
      highlight: "Commit once and stay in flow",
      checkpoints: [
        "Best fit for deep archive reading and long-form premium worlds",
        "Makes membership pages feel like onboarding, not repeat interruption",
        "Good for readers who want premium access to feel ambient and always on",
      ],
    },
  ];

  return renderAppShell(
    "membership",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Membership</div>
          <h1 class="nh-title">${escapeHtml(state.overview?.headline ?? state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.overview?.subheadline ?? "Unlock premium chapters, serialized continuations, and calm reading continuity.")}</p>
          <div class="nh-chip-row">
            <span class="nh-chip">Instant unlock</span>
            <span class="nh-chip">Reader progress preserved</span>
            <span class="nh-chip">${escapeHtml(isUnlocked ? "Membership active" : "Cancel anytime")}</span>
          </div>
          ${state.lockedMessage ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.lockedMessage)}</p></div>` : ""}
          <div class="nh-stat-strip">
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Tier</p>
              <p class="nh-stat-value">${escapeHtml(state.overview?.tier ?? "guest")}</p>
              <p class="nh-item-copy">Current access state</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Entitlement</p>
              <p class="nh-stat-value">${escapeHtml(state.overview?.entitlementScope ?? "none")}</p>
              <p class="nh-item-copy">${escapeHtml(state.entitlementSummary ?? state.overview?.statusLabel ?? "No premium entitlement is active.")}</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Benefits</p>
              <p class="nh-stat-value">${String(benefits.length).padStart(2, "0")}</p>
              <p class="nh-item-copy">Reader-facing value props</p>
            </article>
            <article class="nh-stat-panel">
              <p class="nh-meta-label">Entry source</p>
              <p class="nh-stat-value">${escapeHtml(sourceLabel)}</p>
              <p class="nh-item-copy">Where this unlock flow began</p>
            </article>
          </div>
          <div class="nh-actions">
            ${isUnlocked ? renderActionButton(continueLabel, "controller", "continueAfterPurchase", undefined, "primary") : renderActionButton("Back to library", "controller", "goToCatalog", undefined, "primary")}
            ${isUnlocked ? renderActionButton("Back to library", "controller", "goToCatalog", undefined, "ghost") : ""}
          </div>
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Recommended path</p>
            <h2 class="nh-cover-title">${escapeHtml(isUnlocked ? state.overview?.renewalLabel ?? "Membership active" : plans.find((plan) => plan.id === recommendedPlanId)?.name ?? "Membership plan")}</h2>
            <p class="nh-cover-copy">
              ${escapeHtml(
                isUnlocked
                  ? "Access is already unlocked. This page should now behave like a calm return surface, not a paywall."
                  : unlockOutcomeLabel,
              )}
            </p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Unlock promise</p>
            <p class="nh-item-copy">
              ${escapeHtml(unlockOutcomeLabel)}
            </p>
            <p class="nh-item-copy">${escapeHtml(returnContextLabel)}</p>
            ${
              state.purchaseSuccessMessage
                ? `<div class="nh-lock-banner"><p class="nh-note">${escapeHtml(state.purchaseSuccessMessage)}</p></div>`
                : ""
            }
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Plans",
            title: isUnlocked ? "Membership is active. Keep the return path explicit." : "Choose a plan that matches the reading rhythm, not just the price.",
            copy: isUnlocked
              ? "Once access is unlocked, the page should stop acting like a teaser and start acting like a recovery step."
              : "The plan rail should make it obvious which option is flexible, which one is recommended, and what unlock happens immediately after purchase.",
          })}
          <div class="nh-section-grid">
            ${plans
              .map(
                (plan) => `
                  <article class="nh-plan-card${plan.accent ? " nh-plan-card-accent" : ""}">
                    <div class="nh-grid">
                      <div class="nh-chip-row">
                        ${
                          plan.id === recommendedPlanId
                            ? '<span class="nh-chip">Recommended</span>'
                            : ""
                        }
                        ${
                          state.lastPurchasedPlanId === plan.id
                            ? '<span class="nh-chip">Current plan</span>'
                            : ""
                        }
                      </div>
                      <div class="nh-kicker">${escapeHtml(plan.name)}</div>
                      <div class="nh-plan-price-line">
                        <h3 class="nh-title-small">${escapeHtml(plan.price)}</h3>
                        <p class="nh-plan-price-subtitle">${escapeHtml(plan.cadence)}</p>
                      </div>
                      <p class="nh-item-copy">${escapeHtml(plan.note)}</p>
                      <p class="nh-item-highlight">${escapeHtml(plan.savings)}</p>
                      <p class="nh-item-copy">${escapeHtml(plan.highlight)}</p>
                      <ul class="nh-plan-list">
                        ${plan.checkpoints.map((checkpoint) => `<li>${escapeHtml(checkpoint)}</li>`).join("")}
                      </ul>
                    </div>
                    <div class="nh-actions">
                      ${
                        isUnlocked
                          ? renderActionButton(continueLabel, "controller", "continueAfterPurchase", undefined, plan.accent ? "primary" : "secondary")
                          : renderActionButton(
                              state.purchasing ? "Unlocking..." : `Unlock ${plan.name}`,
                              "controller",
                              "purchaseMembership",
                              plan.id,
                              plan.accent ? "primary" : "secondary",
                            )
                      }
                    </div>
                  </article>
                `,
              )
            .join("")}
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Trust",
            title: isUnlocked ? "Unlocked state should explain the next move." : "Explain what happens the moment a reader pays.",
            copy: isUnlocked
              ? "After purchase, the page should behave like a contextual return surface instead of a sales wall."
              : "This is where the paywall earns trust: immediate unlock, clear return path, and no ambiguity about what changes.",
          })}
          <div class="nh-grid nh-promise-stack">
            <article class="nh-panel">
              <p class="nh-meta-label">Immediate effect</p>
              <p class="nh-item-copy">${escapeHtml(isUnlocked ? "Membership is already active. The next action should take the reader back into the flow without another decision layer." : unlockOutcomeLabel)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Current status</p>
              <p class="nh-item-copy">${escapeHtml(state.entitlementSummary ?? state.overview?.statusLabel ?? "Signed in with standard access. Premium continuation is still locked.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Return path</p>
              <p class="nh-item-copy">${escapeHtml(isUnlocked ? returnContextLabel : returnContextLabel)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Recommendation logic</p>
              <p class="nh-item-copy">${escapeHtml(recommendationLogic)}</p>
            </article>
          </div>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Stay in flow",
            title: isUnlocked ? "Membership should now feel like quiet infrastructure." : "The best plan is the one that removes repeat interruption.",
            copy: isUnlocked
              ? "Once access is active, the page should explain how premium continuity stays calm across detail, shelf, and reader."
              : "Position plans as long-session continuity tools, not just unlock buttons.",
          })}
          <div class="nh-section-grid">
            <article class="nh-item">
              <div class="nh-kicker">Reader continuity</div>
              <h2 class="nh-item-title">Return without losing context</h2>
              <p class="nh-item-copy">${escapeHtml(returnContextLabel)}</p>
            </article>
            <article class="nh-item">
              <div class="nh-kicker">Unlock outcome</div>
              <h2 class="nh-item-title">Immediate, then calm</h2>
              <p class="nh-item-copy">${escapeHtml(unlockOutcomeLabel)}</p>
            </article>
            ${
              state.latestMilestoneTitle
                ? `
                  <article class="nh-item">
                    <div class="nh-kicker">Latest milestone</div>
                    <h2 class="nh-item-title">${escapeHtml(state.latestMilestoneTitle)}</h2>
                    <p class="nh-item-copy">${escapeHtml(state.latestMilestoneCopy ?? "Premium continuity should remember the latest completed milestone as well as the next blocked step.")}</p>
                    <div class="nh-chip-row">
                      ${state.latestMilestoneSourceLabel ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneSourceLabel)}</span>` : ""}
                      ${state.latestMilestoneRecencyLabel ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneRecencyLabel)}</span>` : ""}
                      ${state.latestMilestoneMeta ? `<span class="nh-chip">${escapeHtml(state.latestMilestoneMeta)}</span>` : ""}
                    </div>
                    ${
                      state.latestMilestoneReturnHint
                        ? `<p class="nh-item-copy">${escapeHtml(state.latestMilestoneReturnHint)}</p>`
                        : ""
                    }
                    <div class="nh-actions">
                      ${renderActionButton(state.latestMilestoneReturnLabel ?? "Resume milestone", "controller", "openLatestMilestone", undefined, "secondary")}
                    </div>
                  </article>
                `
                : ""
            }
            <article class="nh-item">
              <div class="nh-kicker">Retention posture</div>
              <h2 class="nh-item-title">${escapeHtml(isUnlocked ? "Membership active" : "Choose the interruption pattern you want least")}</h2>
              <p class="nh-item-copy">${escapeHtml(isUnlocked ? "Once active, membership should step into the background and let detail, shelf, and reader behave like one continuous system." : recommendationLogic)}</p>
            </article>
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "After purchase",
            title: "Conversion should turn into retention immediately.",
            copy: "The moment payment succeeds, the page should stop selling and start stabilizing the next reading session.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Benefit posture</p>
              <p class="nh-item-copy">${escapeHtml(benefits.length > 0 ? `${benefits.length} membership benefits are visible here so value stays legible after the first unlock.` : "Benefits should stay visible after conversion so value does not disappear behind a successful payment state.")}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Best next move</p>
              <p class="nh-item-copy">${escapeHtml(isUnlocked ? `${continueLabel} should be the main path now, because the selling work is already done.` : "Pick the plan that removes the most renewal friction for the kind of reading rhythm you actually keep.")}</p>
            </article>
          </div>
        </aside>
      </section>
      <section class="nh-card">
        ${renderSectionHeading({
          kicker: "Plan comparison",
          title: "Show the difference between flexible, recommended, and deep-commitment plans.",
          copy: "A reader should not have to infer why one plan is highlighted.",
        })}
        <div class="nh-section-grid nh-comparison-grid">
          ${planComparison
            .map(
              (row) => `
                <article class="nh-item">
                  <div class="nh-kicker">${escapeHtml(row.label)}</div>
                  <div class="nh-grid">
                    <div class="nh-meta-grid">
                      <div class="nh-meta-block">
                        <p class="nh-meta-label">Monthly</p>
                        <p class="nh-item-copy">${escapeHtml(row.monthly)}</p>
                      </div>
                      <div class="nh-meta-block">
                        <p class="nh-meta-label">Quarterly</p>
                        <p class="nh-item-copy">${escapeHtml(row.quarterly)}</p>
                      </div>
                      <div class="nh-meta-block">
                        <p class="nh-meta-label">Annual</p>
                        <p class="nh-item-copy">${escapeHtml(row.annual)}</p>
                      </div>
                    </div>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="nh-card">
        ${renderSectionHeading({
          kicker: "Benefits",
          title: "Explain what premium access changes in the reading flow.",
          copy: "Benefits should sound like concrete reading outcomes, not generic upgrade copy.",
        })}
        <div class="nh-section-grid">
          ${benefits
            .map(
              (benefit) => `
                <article class="nh-item">
                  <div class="nh-kicker">${escapeHtml(benefit.label)}</div>
                  <p class="nh-item-copy">${escapeHtml(benefit.description)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      ${
        state.milestoneHistory.length > 0
          ? `
            <section class="nh-card">
              ${renderSectionHeading({
                kicker: "Milestone history",
                title: "Retention should remember the last few reading milestones, not only the current block.",
                copy: "This keeps membership grounded in the reading program that already happened, not only the paywall it interrupted.",
              })}
              <div class="nh-section-grid">
                ${state.milestoneHistory
                  .slice(0, 3)
                  .map(
                    (item, index) => `
                      <article class="nh-item">
                        <div class="nh-kicker">${escapeHtml(item.typeLabel)}</div>
                        <h2 class="nh-item-title">${escapeHtml(item.title)}</h2>
                        <p class="nh-item-copy">${escapeHtml(item.copy)}</p>
                        <div class="nh-chip-row">
                          <span class="nh-chip">${escapeHtml(item.sourceLabel)}</span>
                          ${item.recencyLabel ? `<span class="nh-chip">${escapeHtml(item.recencyLabel)}</span>` : ""}
                          ${item.meta ? `<span class="nh-chip">${escapeHtml(item.meta)}</span>` : ""}
                        </div>
                        <p class="nh-item-copy">${escapeHtml(item.returnHint)}</p>
                        <div class="nh-actions">
                          ${renderActionButton(item.returnLabel, "controller", "openMilestoneHistoryItem", index, "ghost")}
                        </div>
                      </article>
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

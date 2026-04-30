import type { AuthPageState } from "@minix/feature-auth";
import { escapeHtml, type Store } from "@minix/core";

import { renderButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { buildGenericTitle, renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

interface AuthIdentityPageEntry {
  store: Store<AuthPageState>;
  updateCredentials(values: Partial<AuthPageState["credentials"]>): void;
  setLoginMethod(method: "phone_code" | "password"): void;
  requestPhoneVerification(purpose: "guest_upgrade" | "phone_binding"): Promise<unknown>;
  submitIdentityUpgrade(): Promise<unknown>;
  submitPhoneBinding(): Promise<unknown>;
  confirmIdentityMerge(targetUserId?: string): Promise<unknown>;
  cancelIdentityMerge(targetUserId?: string): Promise<unknown>;
}

function renderIdentityImpacts(state: AuthPageState): string {
  const impacts = state.identityWorkflow?.mergePreview?.impacts ?? [];
  if (impacts.length === 0) {
    return `<p class="me-empty">No merge impact preview is available yet. Start the flow to generate a source and target account comparison.</p>`;
  }

  return impacts
    .map(
      (impact) => `
        <article class="me-task-card">
          <p class="me-task-meta">${escapeHtml(impact.label)}</p>
          <h3 class="me-task-title">${escapeHtml(`${impact.sourceCount} + ${impact.targetCount} -> ${impact.mergedCount}`)}</h3>
          <p class="me-task-copy">${escapeHtml(impact.message)}</p>
        </article>
      `,
    )
    .join("");
}

function renderIdentityAudit(state: AuthPageState): string {
  const audit = state.identityWorkflow?.audit ?? [];
  if (audit.length === 0) {
    return `<p class="me-empty">Audit records will appear after preview, confirmation, cancellation, or rollback-safe failure.</p>`;
  }

  return audit
    .map(
      (record) => `
        <div class="me-empty-state">
          <strong>${escapeHtml(record.action)}</strong>
          <p class="me-copy-muted">${escapeHtml(record.message)}</p>
          <p class="me-copy-muted">${escapeHtml(record.createdAt)}</p>
        </div>
      `,
    )
    .join("");
}

export function renderIdentityWorkflowPage(
  context: HostH5PageRenderContext,
  config: {
    pageKey: "identityUpgrade" | "identityBindPhone" | "identityMerge";
    title: string;
    eyebrow: string;
    subtitle: string;
    primaryButtonId: string;
    primaryButtonLabel: string;
    phonePurpose: "guest_upgrade" | "phone_binding";
  },
) {
  const { root, runtime, sync } = context;
  const page = runtime.pages[config.pageKey] as unknown as AuthIdentityPageEntry;
  const state = page.store.getState();
  const workflow = state.identityWorkflow;
  const preview = workflow?.mergePreview;
  const targetLabel = workflow?.targetLabel ?? preview?.targetLabel ?? "No target selected";

  const syncCredentialFields = () => {
    page.updateCredentials({
      phoneNumber: root.querySelector<HTMLInputElement>("#identity-phone")?.value ?? state.credentials.phoneNumber,
      verificationCode: root.querySelector<HTMLInputElement>("#identity-code")?.value ?? state.credentials.verificationCode,
      account: root.querySelector<HTMLInputElement>("#identity-account")?.value ?? state.credentials.account,
      password: root.querySelector<HTMLInputElement>("#identity-password")?.value ?? state.credentials.password,
    });
  };

  renderApp(
    root,
    config.title,
    runtime,
    config.pageKey,
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">${escapeHtml(config.eyebrow)}</p>
            <h1 class="me-title">${escapeHtml(config.title)}</h1>
            <p class="me-subtitle">${escapeHtml(config.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(workflow?.status ?? "start")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(workflow?.stage ?? "start")}</span>
              <span class="me-chip">${escapeHtml(targetLabel)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Recovery</p>
            <h2 class="me-panel-title">${escapeHtml(preview?.recoveryMessage ?? "Every merge path keeps a rollback-safe failure state until explicit confirmation succeeds.")}</h2>
            <ul class="me-panel-list">
              <li>${escapeHtml(`Workflow: ${workflow?.workflowId ?? "not started"}`)}</li>
              <li>${escapeHtml(`Confirmation: ${preview?.requiresConfirmation ? "required" : "not required yet"}`)}</li>
              <li>${escapeHtml(`Rollback safe: ${preview?.canRollback === false ? "no" : "yes"}`)}</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Start</p>
            <h2 class="me-card-title">Verification inputs</h2>
            <p class="me-card-subtitle">Use a real requested code from the sample API. Demo merge phone numbers still produce explicit preview before merging.</p>
            <div class="me-settings-group">
              <input id="identity-phone" class="me-input" placeholder="Phone number" value="${escapeHtml(state.credentials.phoneNumber)}" />
              <input id="identity-code" class="me-input" placeholder="Verification code" value="${escapeHtml(state.credentials.verificationCode)}" />
              ${
                config.pageKey === "identityUpgrade"
                  ? `<input id="identity-account" class="me-input" placeholder="Password account" value="${escapeHtml(state.credentials.account)}" />
                     <input id="identity-password" class="me-input" placeholder="Password" type="password" value="${escapeHtml(state.credentials.password)}" />`
                  : ""
              }
            </div>
            <div class="me-action-group">
              ${renderButton("identity-request-code", "Request Code", "secondary", state.loading)}
              ${config.pageKey === "identityUpgrade" ? renderButton("identity-method-phone", "Use Phone", state.selectedLoginMethod === "phone_code" ? "primary" : "ghost", state.loading) : ""}
              ${config.pageKey === "identityUpgrade" ? renderButton("identity-method-password", "Use Password", state.selectedLoginMethod === "password" ? "primary" : "ghost", state.loading) : ""}
              ${renderButton(config.primaryButtonId, config.primaryButtonLabel, "primary", state.loading)}
            </div>
            ${state.phoneVerification?.debugCode ? `<p class="me-message">Debug code: ${escapeHtml(state.phoneVerification.debugCode)}</p>` : ""}
            ${state.noticeMessage ? `<p class="me-message">${escapeHtml(state.noticeMessage)}</p>` : ""}
            ${state.errorMessage ? `<p class="me-message me-message-error">${escapeHtml(state.errorMessage)}</p>` : ""}
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Preview</p>
            <h2 class="me-card-title">Merge impact summary</h2>
            <div class="me-lesson-list">
              ${renderIdentityImpacts(state)}
            </div>
            <div class="me-action-group">
              ${workflow?.targetUserId ? renderButton("identity-confirm-merge", "Confirm Merge", "primary", state.loading) : ""}
              ${workflow?.targetUserId ? renderButton("identity-cancel-merge", "Cancel Without Changes", "secondary", state.loading) : ""}
            </div>
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Audit</p>
          <h2 class="me-card-title">Operation records</h2>
          <div class="me-settings-group">
            ${renderIdentityAudit(state)}
          </div>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "identity-method-phone", () => {
    page.setLoginMethod("phone_code");
    sync();
  });
  bindButton(root, "identity-method-password", () => {
    page.setLoginMethod("password");
    sync();
  });
  bindButton(root, "identity-request-code", () => {
    syncCredentialFields();
    void page.requestPhoneVerification(config.phonePurpose).then(sync);
  });
  bindButton(root, config.primaryButtonId, () => {
    syncCredentialFields();
    void (config.pageKey === "identityUpgrade"
      ? page.submitIdentityUpgrade()
      : config.pageKey === "identityBindPhone"
        ? page.submitPhoneBinding()
        : page.confirmIdentityMerge()).then(sync);
  });
  bindButton(root, "identity-confirm-merge", () => {
    void page.confirmIdentityMerge().then(sync);
  });
  bindButton(root, "identity-cancel-merge", () => {
    void page.cancelIdentityMerge().then(sync);
  });
}

export function renderLoginPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.login.store.getState();
  const redirectDestinationLabel = state.redirectLabel ?? (state.redirectTarget ? buildGenericTitle(String(state.redirectTarget)) : null);
  const primaryEntry =
    state.loginMethodDescriptors.find((descriptor) => descriptor.defaultOn?.includes("h5")) ??
    state.loginMethodDescriptors[0] ??
    null;
  const redirectReasonLabel =
    state.redirectReason === "force-relogin"
      ? "Force re-login"
      : state.redirectReason === "session-expired"
        ? "Session expired"
        : state.redirectReason === "auth-required"
          ? "Authentication required"
          : null;
  const redirectSummary = state.redirectTarget
    ? `Preserved return target: ${redirectDestinationLabel ?? state.redirectRouteId ?? state.redirectPath ?? String(state.redirectTarget)}${state.redirectRouteId ? ` (route ${state.redirectRouteId})` : state.redirectPath ? ` (path ${state.redirectPath})` : ""}${state.redirectSource ? ` from ${state.redirectSource}` : ""}.`
    : "No protected return target is waiting on this session.";
  const statusText = state.loading
    ? "Preparing your lesson..."
    : state.authStatus === "reauth_required"
      ? redirectDestinationLabel
        ? `Sign in again to continue to ${redirectDestinationLabel}.`
        : "Sign in again to continue."
      : state.authenticated
      ? redirectDestinationLabel
        ? `Signed in. Continue to ${redirectDestinationLabel}, or choose another page from Home.`
        : "Signed in. Use the menu or the actions below to open the rest of the product."
      : "Ready for today's practice";
  const phoneDescriptor = state.loginMethodDescriptors.find((descriptor) => descriptor.method === "phone_code");
  const oauthDescriptor = state.loginMethodDescriptors.find((descriptor) => descriptor.method === "oauth");

  renderApp(
    root,
    "Minute English",
    runtime,
    "login",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-home-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Minute English</p>
            <h1 class="me-title">Build Everyday English in 10 Minutes</h1>
            <p class="me-subtitle">
              A compact English routine for busy learners who want real vocabulary, useful listening, and steady speaking practice.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">Vocabulary</span>
              <span class="me-chip me-chip-accent">Listening</span>
              <span class="me-chip me-chip-warm">Speaking</span>
            </div>
          </div>
          <aside class="me-panel me-home-panel">
            <p class="me-panel-kicker">Why it works</p>
            <h2 class="me-panel-title">Small, repeatable lessons that fit commute time, lunch breaks, and evening review.</h2>
            <ul class="me-panel-list">
              <li>Real-life English instead of long academic units</li>
              <li>A lightweight daily routine rather than a heavy course map</li>
              <li>Clear next steps once you enter the personal dashboard</li>
            </ul>
          </aside>
        </section>

        <section class="me-stat-grid">
          <article class="me-stat-card">
            <p class="me-stat-value">10 min</p>
            <p class="me-stat-label">Typical daily lesson length</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">5 tasks</p>
            <p class="me-stat-label">Short activities in one compact routine</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">Daily</p>
            <p class="me-stat-label">Designed for repeatable, low-friction practice</p>
          </article>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card me-home-preview">
            <p class="me-section-kicker">Experience Preview</p>
            <h2 class="me-card-title">What one lesson looks like</h2>
            <p class="me-card-subtitle">
              Home previews the product. It does not carry personal progress. After sign-in, Overview becomes the first personal page.
            </p>
            <div class="me-lesson-list">
              <article class="me-lesson-card">
                <div class="me-lesson-meta">
                  <span class="me-lesson-index">Step 1</span>
                  <span class="me-lesson-badge">Warm-up</span>
                </div>
                <h3 class="me-lesson-title">Travel Vocabulary</h3>
                <p class="me-lesson-subtitle">8 useful words for airport and hotel check-in.</p>
              </article>
              <article class="me-lesson-card">
                <div class="me-lesson-meta">
                  <span class="me-lesson-index">Step 2</span>
                  <span class="me-lesson-badge">Listen</span>
                </div>
                <h3 class="me-lesson-title">Listening Practice</h3>
                <p class="me-lesson-subtitle">A 45-second dialogue built for daily situations.</p>
              </article>
              <article class="me-lesson-card">
                <div class="me-lesson-meta">
                  <span class="me-lesson-index">Step 3</span>
                  <span class="me-lesson-badge">Speak</span>
                </div>
                <h3 class="me-lesson-title">Speak Out Loud</h3>
                <p class="me-lesson-subtitle">Repeat 5 lines and practice natural rhythm before you finish.</p>
              </article>
            </div>
          </section>

          <section class="me-surface me-card me-home-scenes">
            <p class="me-section-kicker">Built For</p>
            <h2 class="me-card-title">Short study windows, not long sessions</h2>
            <p class="me-card-subtitle">
              Use Home as a clear product entry. The page should explain the value quickly, then hand off to Overview for actual learner context.
            </p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">Commute</p>
                <p class="me-inline-metric-label">Quick input before work</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">Lunch</p>
                <p class="me-inline-metric-label">One lightweight review block</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">Evening</p>
                <p class="me-inline-metric-label">A short speaking reset before sleep</p>
              </div>
            </div>
          </section>
        </section>

        <section class="me-surface me-progress-card me-home-cta">
          <div class="me-progress-row">
            <div class="me-progress-copy">
              <p class="me-section-kicker">Start From Home</p>
              <h2 class="me-progress-title">${escapeHtml(state.authStatus === "reauth_required" ? "Re-authentication is required" : state.authenticated ? "You're signed in. Choose where to go next." : "Sign in from Home when you are ready to begin")}</h2>
              <p class="me-progress-note">
                ${escapeHtml(
                  state.authStatus === "reauth_required"
                    ? `${statusText} The original route id, path, params, and source are preserved until sign-in succeeds.`
                    : state.authenticated
                    ? redirectDestinationLabel
                      ? `${statusText} Home no longer redirects automatically, so you stay in control before returning to the protected page you asked for.`
                      : `${statusText} Home no longer redirects automatically. Use Overview, Today's Plan, or Preferences when you want to move deeper into the product.`
                    : `${statusText} Home explains the product and previews the lesson shape. The rest of the product unlocks after sign-in.`,
                )}
              </p>
            </div>
            <div class="me-progress-pill">${escapeHtml(state.authStatus === "reauth_required" ? "Re-auth" : state.authenticated ? "Signed In" : "Start")}</div>
          </div>
          <div class="me-action-group">
            ${
              state.authenticated
                ? `${state.redirectTarget && redirectDestinationLabel ? renderButton("home-continue-destination", `Continue to ${redirectDestinationLabel}`, "primary") : renderButton("home-open-overview", "Open Overview", "primary")}${renderButton("home-open-plan", "Open Today's Plan", state.redirectTarget ? "ghost" : "secondary")}${renderButton("home-open-settings", "Open Preferences", state.redirectTarget ? "secondary" : "ghost")}`
                : `${renderButton("login", state.loading ? "Preparing your lesson..." : "Sign In To Continue", "primary", state.loading)}${renderButton("restore", "Restore Learning Session", "secondary", state.loading)}`
            }
          </div>
          ${
            state.errorMessage
              ? `<p class="me-message me-message-error">${escapeHtml(state.errorMessage)}</p>`
              : ""
          }
          ${
            state.noticeMessage
              ? `<div class="me-empty-state">${escapeHtml(state.noticeMessage)}</div>`
              : ""
          }
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">Official Auth Entry</p>
            <h2 class="me-card-title">${escapeHtml(primaryEntry?.label ?? "Home sign-in")}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(primaryEntry?.summary ?? "Home keeps one explicit auth entry per host.")}
            </p>
            <p class="me-card-subtitle">
              ${escapeHtml(redirectSummary)}
            </p>
            ${
              redirectReasonLabel
                ? `<p class="me-card-subtitle">${escapeHtml(`Return reason: ${redirectReasonLabel}.`)}</p>`
                : ""
            }
          </section>

          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">Provider Backing</p>
            <h2 class="me-card-title">Login methods stay explicit about real versus sample paths</h2>
            <div class="me-lesson-list">
              ${state.loginMethodDescriptors
                .map((descriptor) => {
                  const modeLabel =
                    descriptor.providerMode === "production"
                      ? "Production-backed"
                      : descriptor.providerMode === "sample"
                        ? "Sample-backed"
                        : "Built-in";
                  const hostLabel =
                    descriptor.defaultOn?.includes("h5")
                      ? "Primary on H5"
                      : descriptor.defaultOn?.includes("wechat")
                        ? "Primary on WeChat"
                        : "Manual path";
                  return `
                    <article class="me-lesson-card">
                      <div class="me-lesson-meta">
                        <span class="me-lesson-index">${escapeHtml(descriptor.label)}</span>
                        <span class="me-lesson-badge">${escapeHtml(`${modeLabel} | ${hostLabel}`)}</span>
                      </div>
                      <p class="me-lesson-subtitle">${escapeHtml(descriptor.summary)}</p>
                      ${
                        descriptor.recoverySummary
                          ? `<p class="me-copy-muted">${escapeHtml(descriptor.recoverySummary)}</p>`
                          : ""
                      }
                    </article>
                  `;
                })
                .join("")}
            </div>
          </section>

        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">SMS Recovery</p>
            <h2 class="me-card-title">Verification and password recovery stay on the current auth surface</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(state.phoneVerification?.message ?? phoneDescriptor?.recoverySummary ?? "Verification codes, retries, and password recovery stay on the current login or identity page.")} 
            </p>
            ${
              state.phoneVerification
                ? `<p class="me-copy-muted">${escapeHtml(`${state.phoneVerification.phoneNumberMasked} · ${state.phoneVerification.providerLabel ?? state.phoneVerification.providerMode ?? "provider pending"}`)}</p>`
                : `<p class="me-copy-muted">No verification code has been requested in this session.</p>`
            }
          </section>

          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">OAuth Callback</p>
            <h2 class="me-card-title">OAuth returns to the current login or bind page</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(state.oauthAuthorization?.message ?? oauthDescriptor?.recoverySummary ?? "OAuth callback and recovery stay on the current login or bind page; no dedicated callback route is required.")}
            </p>
            ${
              state.oauthAuthorization
                ? `<p class="me-copy-muted">${escapeHtml(`${state.oauthAuthorization.providerLabel ?? state.oauthAuthorization.provider} · state ${state.oauthAuthorization.state}`)}</p>`
                : `<p class="me-copy-muted">No OAuth authorization handshake is active in this session.</p>`
            }
          </section>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">Product Promise</p>
            <h2 class="me-card-title">A smaller routine with a clearer loop</h2>
            <p class="me-card-subtitle">
              Home tells you what the product is, Overview shows your daily state, Today's Plan executes the queue, and Preferences controls the session.
            </p>
          </section>

          <section class="me-surface me-card me-home-note">
            <p class="me-section-kicker">After Sign-In</p>
            <h2 class="me-card-title">Overview becomes the working dashboard</h2>
            <p class="me-card-subtitle">
              Expect a progress summary, a recommended next task, and one-tap routes into the full lesson plan and preferences.
            </p>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "login", () => {
    void runtime.pages.login.submitLogin().then(sync);
  });
  bindButton(root, "restore", () => {
    void runtime.pages.login.submitEnsureLogin().then(sync);
  });
  bindButton(root, "home-open-overview", () => {
    void runtime.pages.login.goToOverview().then(sync);
  });
  bindButton(root, "home-continue-destination", () => {
    void runtime.pages.login.goToRedirectTarget().then(sync);
  });
  bindButton(root, "home-open-plan", () => {
    void runtime.pages.login.goToPlan().then(sync);
  });
  bindButton(root, "home-open-settings", () => {
    void runtime.pages.login.goToSettings().then(sync);
  });
}


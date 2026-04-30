import { escapeHtml } from "@minix/core";
import type { FeedbackState } from "@minix/feature-feedback";
import type { MediaToolsState } from "@minix/feature-media-tools";

import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

export function renderMediaToolsPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.mediaTools.store.getState() as MediaToolsState;

  renderApp(
    root,
    "Media Tools",
    runtime,
    "mediaTools",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Workspace</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip ${state.uploadAvailable ? "me-chip-accent" : ""}">${escapeHtml(`Upload ${state.uploadAvailable ? "ready" : "reserved"}`)}</span>
              <span class="me-chip ${state.shareAvailable ? "me-chip-accent" : ""}">${escapeHtml(`Share ${state.shareAvailable ? "ready" : "reserved"}`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Capability Hint</p>
            <h2 class="me-panel-title">Shared contracts, platform-owned execution</h2>
            <ul class="me-panel-list">
              <li>${escapeHtml(`Upload stage: ${state.uploadTask.stage}`)}</li>
              <li>${escapeHtml(`Share channel: ${state.shareChannel.label}`)}</li>
              <li>${escapeHtml(`Share count: ${String(state.shareAttribution.shareCount)}`)}</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Upload</p>
            <h2 class="me-card-title">Upload contract output</h2>
            <section class="me-settings-section">
              <div class="me-settings-item">
                <p class="me-settings-label">Task</p>
                <p class="me-settings-value">${escapeHtml(`${state.uploadTask.taskId} · ${state.uploadTask.stage}`)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Governance</p>
                <p class="me-settings-value">${escapeHtml(`${state.uploadTask.governance.acceptedFileTypes.join(", ")} · max ${String(state.uploadTask.governance.maxSizeBytes)} bytes`)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Provider posture</p>
                <p class="me-settings-value">${escapeHtml(state.uploadProviderSummary)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Asset</p>
                <p class="me-settings-value">${escapeHtml(state.uploadAsset ? `${state.uploadAsset.fileName} -> ${state.uploadAsset.url}` : "No asset selected yet.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Error</p>
                <p class="me-settings-value">${escapeHtml(state.uploadError?.message ?? "No upload error.")}</p>
              </div>
            </section>
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Share</p>
            <h2 class="me-card-title">Share payload and attribution</h2>
            <section class="me-settings-section">
              <div class="me-settings-item">
                <p class="me-settings-label">Payload</p>
                <p class="me-settings-value">${escapeHtml(`${state.sharePayload.title} · ${state.sharePayload.shortLink ?? state.sharePayload.landingUrl ?? "No link"}`)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Channel</p>
                <p class="me-settings-value">${escapeHtml(`${state.shareChannel.label} (${state.shareChannel.kind})`)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Attribution</p>
                <p class="me-settings-value">${escapeHtml(`shares ${state.shareAttribution.shareCount} · clicks ${state.shareAttribution.clickCount} · conversions ${state.shareAttribution.conversionCount}`)}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Provider posture</p>
                <p class="me-settings-value">${escapeHtml(state.shareProviderSummary)}</p>
              </div>
            </section>
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">${escapeHtml(state.resultLabel)}</p>
          <h2 class="me-card-title">Workspace actions</h2>
          <p class="me-card-subtitle">${escapeHtml(state.capabilityHint)}</p>
          <div class="me-chip-row">
            ${state.usageExamples.map((example) => `<span class="me-chip">${escapeHtml(example)}</span>`).join("")}
          </div>
          <div class="me-action-group">
            <button id="media-tools-upload" class="me-button me-button-primary">${escapeHtml(state.primaryActionLabel)}</button>
            <button id="media-tools-share" class="me-button me-button-secondary">${escapeHtml(state.secondaryActionLabel)}</button>
            <button id="media-tools-settings" class="me-button me-button-ghost">Open Preferences</button>
          </div>
          ${state.lastResult ? `<p class="me-message">${escapeHtml(`${state.lastResult.message}${state.lastResult.detail ? ` · ${state.lastResult.detail}` : ""}`)}</p>` : ""}
          ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "media-tools-upload", () => {
    void runtime.pages.mediaTools.startUpload().then(sync);
  });
  bindButton(root, "media-tools-share", () => {
    void runtime.pages.mediaTools.startShare().then(sync);
  });
  bindButton(root, "media-tools-settings", () => {
    void runtime.pages.mediaTools.goToSettings().then(sync);
  });
}

export function renderFeedbackPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.feedback.store.getState() as FeedbackState;
  const selectedCategory = state.categories.find((category) => category.key === state.values.categoryKey);
  const titleError = state.fieldErrors.find((error) => error.field === "title")?.message;
  const descriptionError = state.fieldErrors.find((error) => error.field === "description")?.message;
  const categoryError = state.fieldErrors.find((error) => error.field === "categoryKey")?.message;
  const satisfactionError = state.fieldErrors.find((error) => error.field === "satisfactionScore")?.message;
  const latestStatusLabel = state.latestStatus?.label ?? "No ticket submitted yet";

  const syncDraftValues = () => {
    const title = root.querySelector<HTMLInputElement>("#feedback-title")?.value ?? state.values.title;
    const description =
      root.querySelector<HTMLTextAreaElement>("#feedback-description")?.value ?? state.values.description;
    runtime.pages.feedback.updateValues({
      title,
      description,
    });
  };

  renderApp(
    root,
    "Feedback",
    runtime,
    "feedback",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Service Loop</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle ?? "Report issues, send suggestions, or track a previous feedback ticket.")}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(selectedCategory?.label ?? "Choose a category")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(latestStatusLabel)}</span>
              <span class="me-chip">${escapeHtml(state.values.revisitRequested ? "Follow-up requested" : "No follow-up requested")}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Current Context</p>
            <h2 class="me-panel-title">Captured app and device context travels with each ticket</h2>
            <ul class="me-panel-list">
              <li>${escapeHtml(`Source page: ${state.values.sourcePage || "/feedback"}`)}</li>
              <li>${escapeHtml(`Platform: ${state.values.platform} · version ${state.values.appVersion}`)}</li>
              <li>${escapeHtml(`Device: ${state.values.deviceSummary ?? "No device summary available"}`)}</li>
              <li>${escapeHtml(`Customer service: ${state.serviceHint ?? "Ticket flow only"}`)}</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Ticket Form</p>
            <h2 class="me-card-title">Submit feedback</h2>
            <p class="me-card-subtitle">This page models issue reports, suggestions, complaints, abuse reports, and satisfaction follow-up in one shared contract.</p>

            <section class="me-settings-section">
              <div class="me-settings-item">
                <p class="me-settings-label">Category</p>
                <div class="me-chip-row">
                  ${state.categories
                    .map(
                      (category) => `
                        <button class="me-filter-button ${state.values.categoryKey === category.key ? "me-filter-button-active" : ""}" data-feedback-category="${escapeHtml(category.key)}">
                          ${escapeHtml(category.label)}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
                ${categoryError ? `<p class="me-message me-message-error">${escapeHtml(categoryError)}</p>` : ""}
              </div>

              <div class="me-settings-item">
                <p class="me-settings-label">Type</p>
                <div class="me-chip-row">
                  ${["issue_report", "suggestion", "complaint", "abuse_report", "satisfaction"]
                    .map(
                      (type) => `
                        <button class="me-filter-button ${state.values.type === type ? "me-filter-button-active" : ""}" data-feedback-type="${type}">
                          ${escapeHtml(type.replaceAll("_", " "))}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </div>

              <div class="me-settings-item">
                <label class="me-settings-label" for="feedback-title">Title</label>
                <input id="feedback-title" class="me-input me-input-block" value="${escapeHtml(state.values.title)}" placeholder="Short summary of the problem or suggestion" />
                ${titleError ? `<p class="me-message me-message-error">${escapeHtml(titleError)}</p>` : ""}
              </div>

              <div class="me-settings-item">
                <label class="me-settings-label" for="feedback-description">Description</label>
                <textarea id="feedback-description" class="me-input me-input-block me-input-area" placeholder="Describe the issue, steps, expected behavior, or suggestion.">${escapeHtml(state.values.description)}</textarea>
                ${descriptionError ? `<p class="me-message me-message-error">${escapeHtml(descriptionError)}</p>` : ""}
              </div>

              <div class="me-settings-item">
                <p class="me-settings-label">Satisfaction score</p>
                <div class="me-chip-row">
                  ${[1, 2, 3, 4, 5]
                    .map(
                      (score) => `
                        <button class="me-filter-button ${state.values.satisfactionScore === score ? "me-filter-button-active" : ""}" data-feedback-score="${String(score)}">
                          ${escapeHtml(`${score}/5`)}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
                ${satisfactionError ? `<p class="me-message me-message-error">${escapeHtml(satisfactionError)}</p>` : ""}
              </div>
            </section>

            <div class="me-action-group">
              <button id="feedback-submit" class="me-button me-button-primary" ${state.submitting ? "disabled" : ""}>${state.submitting ? "Submitting..." : "Submit ticket"}</button>
              <button id="feedback-toggle-revisit" class="me-button me-button-secondary">${escapeHtml(state.values.revisitRequested ? "Disable follow-up" : "Request follow-up")}</button>
              <button id="feedback-refresh" class="me-button me-button-ghost">Refresh latest status</button>
            </div>
            ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
            ${
              state.lastSubmission?.submittedAt !== undefined
                ? `<p class="me-message">${escapeHtml(`Latest ticket saved at ${new Date(state.lastSubmission.submittedAt).toLocaleString("en-US")}.`)}</p>`
                : ""
            }
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Attachments</p>
            <h2 class="me-card-title">Context capture</h2>
            <section class="me-settings-section">
              <div class="me-settings-item">
                <p class="me-settings-label">Screenshots</p>
                <p class="me-settings-value">${escapeHtml(state.values.screenshotAssets.map((asset) => asset.fileName).join(", ") || "No screenshots attached yet.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Attachments</p>
                <p class="me-settings-value">${escapeHtml(state.values.attachmentAssets.map((asset) => asset.fileName).join(", ") || "No attachments attached yet.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">Category guidance</p>
                <p class="me-settings-value">${escapeHtml(selectedCategory?.description ?? "Choose a category to reveal tailored guidance.")}</p>
              </div>
              <div class="me-settings-item">
                <p class="me-settings-label">FAQ handoff</p>
                <p class="me-settings-value">${escapeHtml(selectedCategory?.faqEntry?.title ?? "No FAQ handoff configured.")}</p>
              </div>
            </section>
            <div class="me-action-group">
              <button id="feedback-add-screenshot" class="me-button me-button-secondary">Add sample screenshot</button>
              <button id="feedback-add-attachment" class="me-button me-button-secondary">Add sample attachment</button>
              <button id="feedback-settings" class="me-button me-button-ghost">Open Preferences</button>
              <button id="feedback-cancel" class="me-button me-button-ghost">Back to Account</button>
            </div>
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Latest Ticket</p>
          <h2 class="me-card-title">Status and processing trail</h2>
          ${
            state.latestTicket && state.latestStatus && state.latestCategory
              ? `
                <section class="me-settings-section">
                  <div class="me-settings-item">
                    <p class="me-settings-label">${escapeHtml(state.latestTicket.title)}</p>
                    <p class="me-settings-value">${escapeHtml(`${state.latestCategory.label} · ${state.latestStatus.label}`)}</p>
                  </div>
                  <div class="me-settings-item">
                    <p class="me-settings-label">Description</p>
                    <p class="me-settings-value">${escapeHtml(state.latestTicket.description)}</p>
                  </div>
                  <div class="me-settings-item">
                    <p class="me-settings-label">Progress</p>
                    <p class="me-settings-value">${escapeHtml(state.latestStatus.progressLabel)}</p>
                    <div class="me-chip-row">
                      ${state.latestStatus.handlingProgress.map((step) => `<span class="me-chip">${escapeHtml(step)}</span>`).join("")}
                    </div>
                  </div>
                  <div class="me-settings-item">
                    <p class="me-settings-label">Processing history</p>
                    <div class="me-settings-group">
                      ${state.latestStatus.processingHistory
                        .map(
                          (record) => `
                            <div class="me-empty-state">
                              <strong>${escapeHtml(record.actionLabel)}</strong>
                              <p class="me-copy-muted">${escapeHtml(`${record.actorLabel} · ${record.recordedAt}`)}</p>
                              ${record.note ? `<p class="me-copy-muted">${escapeHtml(record.note)}</p>` : ""}
                            </div>
                          `,
                        )
                        .join("")}
                    </div>
                  </div>
                </section>
              `
              : `<p class="me-empty">No feedback ticket has been submitted in this sample session yet.</p>`
          }
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "feedback-submit", () => {
    syncDraftValues();
    void runtime.pages.feedback.submit().then(sync);
  });
  bindButton(root, "feedback-toggle-revisit", () => {
    syncDraftValues();
    runtime.pages.feedback.toggleRevisitRequested();
    sync();
  });
  bindButton(root, "feedback-refresh", () => {
    void runtime.pages.feedback.refreshLatestStatus().then(sync);
  });
  bindButton(root, "feedback-add-screenshot", () => {
    syncDraftValues();
    runtime.pages.feedback.addSampleScreenshot();
    sync();
  });
  bindButton(root, "feedback-add-attachment", () => {
    syncDraftValues();
    runtime.pages.feedback.addSampleAttachment();
    sync();
  });
  bindButton(root, "feedback-settings", () => {
    void runtime.pages.feedback.goToSettings().then(sync);
  });
  bindButton(root, "feedback-cancel", () => {
    void runtime.pages.feedback.cancel().then(sync);
  });
  root.querySelectorAll<HTMLElement>("[data-feedback-category]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraftValues();
      const categoryKey = button.dataset.feedbackCategory;
      if (!categoryKey) {
        return;
      }

      runtime.pages.feedback.setCategory(categoryKey);
      sync();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feedback-type]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraftValues();
      const type = button.dataset.feedbackType;
      if (!type) {
        return;
      }

      runtime.pages.feedback.setType(type as FeedbackState["values"]["type"]);
      sync();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feedback-score]").forEach((button) => {
    button.addEventListener("click", () => {
      const score = Number(button.dataset.feedbackScore);
      if (!Number.isFinite(score)) {
        return;
      }

      runtime.pages.feedback.setSatisfactionScore(score);
      sync();
    });
  });
}




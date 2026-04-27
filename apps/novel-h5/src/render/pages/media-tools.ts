import type { MediaToolsState } from "@minix/feature-media-tools";

import { renderSectionHeading } from "../components/section-heading";
import { renderStatPanels } from "../components/stat-panel";
import { renderAppShell } from "../layout/app-shell";
import { escapeHtml, renderActionButton, renderRouteLink, routePath } from "../utils";

export function renderMediaToolsPage(state: MediaToolsState): string {
  return renderAppShell(
    "mediaTools",
    `
      <section class="nh-card nh-hero-grid">
        <div class="nh-grid nh-hero-copy">
          <div class="nh-kicker">Reader workspace</div>
          <h1 class="nh-title">${escapeHtml(state.title)}</h1>
          <p class="nh-copy">${escapeHtml(state.subtitle)}</p>
          <div class="nh-stat-strip">
            ${renderStatPanels([
              {
                label: "Upload",
                value: state.uploadAvailable ? "Ready" : "Reserved",
                note: state.uploadTask.stage,
              },
              {
                label: "Share",
                value: state.shareAvailable ? "Ready" : "Reserved",
                note: state.shareChannel.label,
              },
              {
                label: "Attribution",
                value: state.shareAttribution.shareCount,
                note: "Share count tracked through the shared attribution model.",
              },
            ])}
          </div>
          <div class="nh-actions">
            ${renderActionButton(state.primaryActionLabel, "controller", "startUpload", undefined, "primary")}
            ${renderActionButton(state.secondaryActionLabel, "controller", "startShare", undefined, "secondary")}
            ${renderActionButton("Refresh report", "controller", "loadShareReport", state.shareAttribution.attributionId, "ghost")}
            ${renderActionButton("Open preferences", "controller", "goToSettings", undefined, "ghost")}
          </div>
          ${state.lastResult ? `<p class="nh-item-copy">${escapeHtml(`${state.lastResult.message}${state.lastResult.detail ? ` · ${state.lastResult.detail}` : ""}`)}</p>` : ""}
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Provider posture</p>
            <h2 class="nh-cover-title">${escapeHtml(state.resultLabel)}</h2>
            <p class="nh-cover-copy">${escapeHtml(state.capabilityHint)}</p>
          </div>
          <article class="nh-panel nh-issue-panel">
            <p class="nh-meta-label">Usage examples</p>
            <p class="nh-item-copy">${escapeHtml(state.usageExamples.join(" · "))}</p>
          </article>
        </aside>
      </section>
      <section class="nh-sidebar-grid">
        <section class="nh-card">
          ${renderSectionHeading({
            kicker: "Upload posture",
            title: "Storage and review state is visible on the reader host now.",
            copy: "This keeps screenshots, attachments, and asset governance inspectable without hiding the shared upload contract behind another app shell.",
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Governance</p>
              <p class="nh-item-copy">${escapeHtml(`${state.uploadTask.governance.acceptedFileTypes.join(", ")} · max ${String(state.uploadTask.governance.maxSizeBytes)} bytes`)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Provider</p>
              <p class="nh-item-copy">${escapeHtml(state.uploadProviderSummary)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Latest asset</p>
              <p class="nh-item-copy">${escapeHtml(state.uploadAsset ? `${state.uploadAsset.fileName} -> ${state.uploadAsset.url}` : "No asset selected yet.")}</p>
            </article>
          </div>
        </section>
        <aside class="nh-card">
          ${renderSectionHeading({
            kicker: "Share posture",
            title: "Invite and return-flow state no longer stops at the generic hosts.",
            copy: "Novel hosts can now surface the same share payload, attribution, and provider posture used elsewhere.",
            compact: true,
          })}
          <div class="nh-grid">
            <article class="nh-panel">
              <p class="nh-meta-label">Payload</p>
              <p class="nh-item-copy">${escapeHtml(`${state.sharePayload.title} · ${state.sharePayload.shortLink ?? state.sharePayload.landingUrl ?? "No link"}`)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Provider</p>
              <p class="nh-item-copy">${escapeHtml(state.shareProviderSummary)}</p>
            </article>
            <article class="nh-panel">
              <p class="nh-meta-label">Navigation</p>
              <div class="nh-actions">
                ${renderActionButton("Retry primary action", "controller", "retryPrimaryAction", undefined, "secondary")}
                ${renderActionButton("Clear result", "controller", "clearLastResult", undefined, "ghost")}
                ${renderRouteLink("Open support", routePath("feedback"), "ghost")}
              </div>
            </article>
          </div>
        </aside>
      </section>
    `,
  );
}

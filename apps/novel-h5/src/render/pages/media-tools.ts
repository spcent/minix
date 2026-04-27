import type { MediaToolsState } from "@minix/feature-media-tools";

import { renderActionRow } from "../components/action-row";
import { renderInfoPanel } from "../components/info-panel";
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
          ${renderActionRow([
            renderActionButton(state.primaryActionLabel, "controller", "startUpload", undefined, "primary"),
            renderActionButton(state.secondaryActionLabel, "controller", "startShare", undefined, "secondary"),
            renderActionButton("Refresh report", "controller", "loadShareReport", state.shareAttribution.attributionId, "ghost"),
            renderActionButton("Open preferences", "controller", "goToSettings", undefined, "ghost"),
          ])}
          ${state.lastResult ? `<p class="nh-item-copy">${escapeHtml(`${state.lastResult.message}${state.lastResult.detail ? ` · ${state.lastResult.detail}` : ""}`)}</p>` : ""}
          ${state.errorText ? `<p class="nh-item-copy">${escapeHtml(state.errorText)}</p>` : ""}
        </div>
        <aside class="nh-grid">
          <div class="nh-cover">
            <p class="nh-cover-kicker">Provider posture</p>
            <h2 class="nh-cover-title">${escapeHtml(state.resultLabel)}</h2>
            <p class="nh-cover-copy">${escapeHtml(state.capabilityHint)}</p>
          </div>
          ${renderInfoPanel({
            label: "Usage examples",
            copy: state.usageExamples.join(" · "),
            className: "nh-panel nh-issue-panel",
          })}
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
            ${renderInfoPanel({
              label: "Governance",
              copy: `${state.uploadTask.governance.acceptedFileTypes.join(", ")} · max ${String(state.uploadTask.governance.maxSizeBytes)} bytes`,
            })}
            ${renderInfoPanel({
              label: "Provider",
              copy: state.uploadProviderSummary,
            })}
            ${renderInfoPanel({
              label: "Latest asset",
              copy: state.uploadAsset ? `${state.uploadAsset.fileName} -> ${state.uploadAsset.url}` : "No asset selected yet.",
            })}
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
            ${renderInfoPanel({
              label: "Payload",
              copy: `${state.sharePayload.title} · ${state.sharePayload.shortLink ?? state.sharePayload.landingUrl ?? "No link"}`,
            })}
            ${renderInfoPanel({
              label: "Provider",
              copy: state.shareProviderSummary,
            })}
            ${renderInfoPanel({
              label: "Navigation",
              actions: [
                renderActionButton("Retry primary action", "controller", "retryPrimaryAction", undefined, "secondary"),
                renderActionButton("Clear result", "controller", "clearLastResult", undefined, "ghost"),
                renderRouteLink("Open support", routePath("feedback"), "ghost"),
              ],
            })}
          </div>
        </aside>
      </section>
    `,
  );
}

import type { AccountState } from "@minix/feature-account";
import type { AuthPageState } from "@minix/feature-auth";
import type { FeedbackState } from "@minix/feature-feedback";
import type { FeedState } from "@minix/feature-feed";
import type { ItemsFilterValue, ItemsPageItem } from "@minix/feature-items";
import type { MediaToolsState } from "@minix/feature-media-tools";
import type { MessagesState } from "@minix/feature-messages";
import type { SettingsPageModel, Store } from "@minix/core";

import type { HostH5Runtime } from "../manifest/app.manifest";
import { HOST_H5_ROUTES } from "../manifest/routes";

export type HostH5PageKey = keyof HostH5Runtime["registry"];
export type HostH5PageEntry = ReturnType<HostH5Runtime["registry"][HostH5PageKey]["createEntry"]>;

export interface HostH5PageRenderContext {
  root: HTMLElement;
  runtime: HostH5Runtime;
  pageKey: HostH5PageKey;
  entry: HostH5PageEntry;
  sync(): void;
}

interface PageWithStore {
  store: Store<unknown>;
}

interface PageWithReadyAction {
  markReady(): unknown;
}

interface HostH5PageRenderer {
  render(context: HostH5PageRenderContext): void;
}

interface PageEntryWithShow {
  onShow(): Promise<unknown>;
}

let completionAnimationTimer: number | null = null;

const APP_STYLES = `
  :root {
    color-scheme: light;
  }

  body {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(255, 248, 231, 0.95), transparent 32%),
      radial-gradient(circle at top right, rgba(190, 226, 211, 0.7), transparent 28%),
      linear-gradient(180deg, #f6efe6 0%, #eef7f4 100%);
    color: #14213d;
  }

  #app {
    min-height: 100vh;
  }

  .me-app {
    min-height: 100vh;
    padding: 32px 20px 56px;
    box-sizing: border-box;
  }

  .me-shell {
    width: min(1040px, 100%);
    margin: 0 auto;
  }

  .me-shell-layout {
    display: grid;
    gap: 28px;
  }

  .me-site-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 16px 0 24px;
    border-bottom: 1px solid rgba(20, 33, 61, 0.12);
  }

  .me-header-landing {
    padding: 18px 0 28px;
    border-bottom-color: rgba(127, 85, 57, 0.14);
  }

  .me-header-dashboard {
    padding: 18px 22px;
    border: 1px solid rgba(18, 60, 105, 0.08);
    border-radius: 24px;
    background: rgba(247, 250, 255, 0.92);
  }

  .me-header-execution {
    padding: 18px 22px;
    border: 1px solid rgba(18, 60, 105, 0.1);
    border-radius: 24px;
    background: rgba(244, 248, 253, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .me-header-profile {
    padding: 18px 22px;
    border: 1px solid rgba(127, 85, 57, 0.1);
    border-radius: 24px;
    background: rgba(252, 248, 242, 0.96);
  }

  .me-brand-block {
    display: grid;
    gap: 8px;
  }

  .me-brand-button {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: #14213d;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    text-align: left;
  }

  .me-brand-caption {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
    color: #5c677d;
  }

  .me-site-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    justify-content: flex-end;
  }

  .me-nav-group,
  .me-nav-utility {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
  }

  .me-nav-divider {
    width: 1px;
    height: 26px;
    background: rgba(20, 33, 61, 0.12);
  }

  .me-nav-button {
    appearance: none;
    border: 0;
    border-bottom: 3px solid transparent;
    min-height: 44px;
    padding: 0 2px;
    background: transparent;
    color: #66717f;
    cursor: pointer;
    font-size: 17px;
    font-weight: 700;
    transition: color 120ms ease, border-color 120ms ease;
  }

  .me-nav-button:hover {
    color: #14213d;
  }

  .me-nav-button-active {
    color: #14213d;
    border-color: #c96f3b;
  }

  .me-nav-utility-link {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: #7a8594;
    font-size: 17px;
    cursor: default;
  }

  .me-nav-utility-link-accent {
    color: #5c677d;
  }

  .me-screen {
    display: grid;
    gap: 24px;
  }

  .me-surface {
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(18, 60, 105, 0.08);
    border-radius: 28px;
    box-shadow: 0 18px 48px rgba(20, 33, 61, 0.08);
    backdrop-filter: blur(10px);
    overflow: hidden;
    animation: me-rise 360ms ease both;
  }

  .me-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
    gap: 24px;
    padding: 32px;
  }

  .me-hero-copy {
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .me-eyebrow {
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #123c69;
    font-weight: 700;
  }

  .me-title {
    margin: 0;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .me-subtitle {
    margin: 0;
    max-width: 58ch;
    font-size: 18px;
    line-height: 1.6;
    color: #5c677d;
  }

  .me-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .me-chip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    background: #eef4ff;
    color: #123c69;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .me-chip-accent {
    background: #e7f4ee;
    color: #2f5d50;
  }

  .me-chip-warm {
    background: #fff4db;
    color: #8a5a00;
  }

  .me-panel {
    display: grid;
    gap: 14px;
    align-content: start;
    padding: 24px;
    border-radius: 24px;
    background: linear-gradient(180deg, #123c69 0%, #194d82 100%);
    color: #f8fbff;
  }

  .me-panel-kicker {
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
  }

  .me-panel-title {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
  }

  .me-panel-list {
    display: grid;
    gap: 10px;
    padding: 0;
    margin: 0;
    list-style: none;
    color: rgba(255, 255, 255, 0.84);
  }

  .me-grid {
    display: grid;
    gap: 24px;
  }

  .me-grid-columns {
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  }

  .me-card {
    padding: 28px;
  }

  .me-card-title {
    margin: 0 0 8px;
    font-size: 26px;
    line-height: 1.2;
  }

  .me-card-subtitle {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .me-stat-card {
    padding: 20px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(18, 60, 105, 0.08);
  }

  .me-stat-value {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  .me-stat-label {
    margin-top: 8px;
    color: #5c677d;
    font-size: 14px;
    line-height: 1.4;
  }

  .me-progress-card {
    display: grid;
    gap: 18px;
    padding: 24px 28px;
    background:
      radial-gradient(circle at top right, rgba(190, 226, 211, 0.5), transparent 30%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(246, 251, 249, 0.95) 100%);
  }

  .me-progress-row {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 16px;
  }

  .me-progress-copy {
    display: grid;
    gap: 8px;
  }

  .me-progress-title {
    margin: 0;
    font-size: 30px;
    line-height: 1.05;
    letter-spacing: -0.04em;
  }

  .me-progress-note {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-progress-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 88px;
    min-height: 88px;
    padding: 0 18px;
    border-radius: 24px;
    background: #123c69;
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.04em;
    box-shadow: 0 16px 34px rgba(18, 60, 105, 0.18);
  }

  .me-progress-track {
    position: relative;
    height: 14px;
    border-radius: 999px;
    background: rgba(18, 60, 105, 0.09);
    overflow: hidden;
  }

  .me-progress-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: linear-gradient(90deg, #7fb069 0%, #123c69 100%);
    transition: width 180ms ease;
  }

  .me-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .me-filter-button {
    appearance: none;
    border: 1px solid rgba(18, 60, 105, 0.08);
    border-radius: 999px;
    min-height: 40px;
    padding: 0 16px;
    background: rgba(243, 246, 251, 0.72);
    color: #123c69;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    transition: transform 120ms ease, background 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  .me-filter-button:hover {
    transform: translateY(-1px);
  }

  .me-filter-button-active {
    background: #123c69;
    border-color: #123c69;
    color: #ffffff;
  }

  .me-action-group {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 8px;
  }

  .me-button {
    appearance: none;
    border: 0;
    border-radius: 16px;
    padding: 14px 20px;
    min-height: 52px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  }

  .me-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .me-button:disabled {
    opacity: 0.64;
    cursor: default;
  }

  .me-button-primary {
    background: #123c69;
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(18, 60, 105, 0.18);
  }

  .me-button-secondary {
    background: #f3f6fb;
    color: #123c69;
    border: 1px solid rgba(18, 60, 105, 0.12);
  }

  .me-button-danger {
    background: #9f3d2f;
    color: #fffdf8;
    box-shadow: 0 12px 28px rgba(159, 61, 47, 0.18);
  }

  .me-button-ghost {
    background: rgba(255, 255, 255, 0.55);
    color: #123c69;
    border: 1px dashed rgba(18, 60, 105, 0.18);
  }

  .me-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #5c677d;
  }

  .me-message-error {
    color: #b42318;
  }

  .me-lesson-list {
    display: grid;
    gap: 16px;
    margin-top: 20px;
  }

  .me-lesson-card {
    padding: 20px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.92) 100%);
    border: 1px solid rgba(18, 60, 105, 0.08);
    transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease;
  }

  .me-lesson-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(20, 33, 61, 0.08);
  }

  .me-lesson-card-complete {
    background: linear-gradient(180deg, rgba(240, 248, 244, 0.98) 0%, rgba(232, 244, 237, 0.92) 100%);
    border-color: rgba(127, 176, 105, 0.45);
  }

  .me-lesson-card-selected {
    border-color: rgba(18, 60, 105, 0.26);
    box-shadow: 0 16px 34px rgba(18, 60, 105, 0.1);
  }

  .me-lesson-card-just-completed {
    animation: me-complete-pop 720ms ease;
  }

  .me-lesson-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .me-lesson-index {
    font-size: 14px;
    font-weight: 700;
    color: #5c677d;
  }

  .me-lesson-badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: #fff2d7;
    color: #8a5a00;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .me-lesson-badge-complete {
    background: #e7f4ee;
    color: #2f5d50;
  }

  .me-lesson-title {
    margin: 0 0 8px;
    font-size: 22px;
    line-height: 1.2;
  }

  .me-lesson-subtitle {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-lesson-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }

  .me-lesson-tag {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(243, 246, 251, 0.9);
    color: #5c677d;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .me-lesson-reason {
    margin: 16px 0 0;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255, 244, 219, 0.72);
    color: #7f5539;
    line-height: 1.55;
    font-size: 14px;
  }

  .me-lesson-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-top: 18px;
  }

  .me-lesson-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .me-lesson-status {
    margin: 0;
    font-size: 13px;
    color: #5c677d;
  }

  .me-section-kicker {
    margin: 0;
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #5c677d;
    font-weight: 700;
  }

  .me-settings-group {
    display: grid;
    gap: 20px;
  }

  .me-settings-section {
    display: grid;
    gap: 12px;
  }

  .me-settings-title {
    margin: 0;
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7f5539;
    font-weight: 700;
  }

  .me-settings-item {
    padding: 18px 0;
    border-bottom: 1px solid rgba(18, 60, 105, 0.08);
  }

  .me-settings-item:last-child {
    border-bottom: 0;
  }

  .me-settings-label {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
    color: #14213d;
  }

  .me-settings-value {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-empty-state {
    padding: 24px;
    border-radius: 22px;
    background: rgba(243, 246, 251, 0.8);
    color: #5c677d;
  }

  .me-empty,
  .me-copy-muted {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-input {
    min-width: 220px;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(18, 60, 105, 0.14);
    background: rgba(255, 255, 255, 0.92);
    color: #14213d;
    font: inherit;
  }

  .me-input-block {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .me-input-area {
    min-height: 140px;
    padding: 14px;
    resize: vertical;
  }

  .me-summary-card {
    display: grid;
    gap: 18px;
  }

  .me-summary-card .me-card-title,
  .me-summary-card .me-card-subtitle {
    max-width: 720px;
  }

  .me-detail-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding-left: 18px;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-detail-note {
    margin: 0;
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(243, 246, 251, 0.82);
    color: #4b5563;
    line-height: 1.55;
    font-size: 14px;
  }

  .me-inline-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .me-inline-metric {
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(243, 246, 251, 0.78);
    border: 1px solid rgba(18, 60, 105, 0.06);
  }

  .me-inline-metric-value {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  .me-inline-metric-label {
    margin: 6px 0 0;
    color: #5c677d;
    font-size: 13px;
  }

  .me-site-footer {
    display: grid;
    gap: 18px;
    padding: 24px 0 8px;
    border-top: 1px solid rgba(20, 33, 61, 0.12);
  }

  .me-footer-landing {
    padding-top: 28px;
    border-top-color: rgba(127, 85, 57, 0.14);
  }

  .me-footer-dashboard {
    padding: 22px 24px 8px;
    border: 1px solid rgba(18, 60, 105, 0.08);
    border-radius: 24px;
    background: rgba(247, 250, 255, 0.92);
  }

  .me-footer-execution {
    padding: 22px 24px 8px;
    border: 1px solid rgba(18, 60, 105, 0.1);
    border-radius: 24px;
    background: rgba(244, 248, 253, 0.96);
  }

  .me-footer-profile {
    padding: 22px 24px 8px;
    border: 1px solid rgba(127, 85, 57, 0.1);
    border-radius: 24px;
    background: rgba(252, 248, 242, 0.96);
  }

  .me-footer-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
    gap: 20px;
    align-items: start;
  }

  .me-footer-copy {
    display: grid;
    gap: 10px;
  }

  .me-footer-title {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
  }

  .me-footer-text {
    margin: 0;
    color: #5c677d;
    line-height: 1.6;
  }

  .me-footer-links {
    display: grid;
    gap: 10px;
  }

  .me-footer-links-title {
    margin: 0;
    font-size: 12px;
    line-height: 1;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #5c677d;
    font-weight: 700;
  }

  .me-footer-link-list {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
  }

  .me-footer-link {
    appearance: none;
    border: 0;
    padding: 0;
    background: transparent;
    color: #66717f;
    font-size: 16px;
    line-height: 1.4;
    cursor: pointer;
  }

  .me-footer-link-active {
    color: #14213d;
    text-decoration: underline;
    text-decoration-color: #c96f3b;
    text-underline-offset: 7px;
  }

  .me-footer-link-muted {
    color: #8c96a3;
    cursor: default;
  }

  .me-footer-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 6px;
    color: #5c677d;
    font-size: 13px;
  }

  .me-app-home .me-shell {
    width: min(1140px, 100%);
  }

  .me-app-home .me-screen {
    gap: 28px;
  }

  .me-home-hero {
    position: relative;
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.75fr);
    padding: 44px;
    background:
      radial-gradient(circle at 18% 18%, rgba(255, 244, 219, 0.92), transparent 30%),
      linear-gradient(135deg, rgba(255, 250, 243, 0.98) 0%, rgba(246, 238, 226, 0.92) 48%, rgba(236, 246, 241, 0.9) 100%);
  }

  .me-home-panel {
    background:
      radial-gradient(circle at top right, rgba(255, 244, 219, 0.22), transparent 32%),
      linear-gradient(180deg, #102f56 0%, #173e6a 100%);
    box-shadow: 0 18px 34px rgba(16, 47, 86, 0.16);
  }

  .me-home-preview {
    background: rgba(255, 253, 248, 0.94);
  }

  .me-home-scenes {
    background:
      linear-gradient(180deg, rgba(250, 251, 253, 0.98) 0%, rgba(241, 247, 244, 0.94) 100%);
  }

  .me-home-cta {
    background:
      radial-gradient(circle at top left, rgba(255, 244, 219, 0.72), transparent 26%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 242, 233, 0.94) 100%);
  }

  .me-home-note {
    background: rgba(255, 255, 255, 0.76);
  }

  .me-app-overview .me-shell {
    width: min(1180px, 100%);
  }

  .me-app-overview .me-screen {
    gap: 18px;
  }

  .me-app-overview .me-site-header {
    padding-bottom: 18px;
  }

  .me-overview-hero {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    padding: 26px 28px;
    background:
      linear-gradient(180deg, rgba(248, 251, 255, 0.98) 0%, rgba(243, 248, 252, 0.95) 100%);
    border-radius: 24px;
  }

  .me-overview-hero .me-title {
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.04;
  }

  .me-overview-panel {
    gap: 12px;
    padding: 20px 22px;
    border-radius: 20px;
    background:
      linear-gradient(180deg, #14365f 0%, #173f6d 100%);
  }

  .me-overview-stats .me-stat-card {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(248, 251, 255, 0.92);
    box-shadow: none;
  }

  .me-overview-progress {
    padding: 20px 24px;
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(242, 248, 252, 0.94) 100%);
  }

  .me-overview-workspace {
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
    align-items: start;
  }

  .me-overview-card {
    padding: 24px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.94);
  }

  .me-app-items .me-shell {
    width: min(1220px, 100%);
  }

  .me-app-items .me-screen {
    gap: 18px;
  }

  .me-execution-hero {
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    padding: 26px 28px;
    background:
      linear-gradient(180deg, rgba(248, 251, 255, 0.98) 0%, rgba(241, 247, 252, 0.95) 100%);
    border-radius: 24px;
  }

  .me-execution-panel {
    gap: 12px;
    padding: 20px 22px;
    border-radius: 20px;
    background:
      linear-gradient(180deg, #17395f 0%, #153c63 100%);
  }

  .me-execution-stats .me-stat-card {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(248, 251, 255, 0.94);
    box-shadow: none;
  }

  .me-execution-progress {
    padding: 20px 24px;
    border-radius: 22px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(242, 248, 252, 0.96) 100%);
  }

  .me-execution-workspace {
    grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.7fr);
    align-items: start;
  }

  .me-execution-queue,
  .me-execution-controls {
    padding: 24px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
  }

  .me-execution-queue .me-lesson-list {
    gap: 14px;
  }

  .me-execution-controls .me-inline-metrics {
    display: grid;
    grid-template-columns: 1fr;
  }

  .me-app-settings .me-shell {
    width: min(1080px, 100%);
  }

  .me-app-settings .me-screen {
    gap: 20px;
  }

  .me-profile-hero {
    grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
    padding: 28px 30px;
    background:
      linear-gradient(180deg, rgba(253, 249, 243, 0.98) 0%, rgba(249, 244, 236, 0.95) 100%);
    border-radius: 24px;
  }

  .me-profile-panel {
    gap: 12px;
    padding: 20px 22px;
    border-radius: 20px;
    background:
      linear-gradient(180deg, #7f5539 0%, #8f6244 100%);
  }

  .me-profile-workspace {
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    align-items: start;
  }

  .me-profile-card,
  .me-profile-actions {
    padding: 24px;
    border-radius: 22px;
    background: rgba(255, 252, 248, 0.96);
  }

  @keyframes me-rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes me-complete-pop {
    0% {
      transform: scale(0.98);
      box-shadow: 0 0 0 rgba(127, 176, 105, 0);
    }

    45% {
      transform: scale(1.01);
      box-shadow: 0 16px 34px rgba(127, 176, 105, 0.22);
    }

    100% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(127, 176, 105, 0);
    }
  }

  @media (max-width: 860px) {
    .me-hero,
    .me-grid-columns,
    .me-stat-grid,
    .me-footer-grid {
      grid-template-columns: 1fr;
    }

    .me-progress-row,
    .me-lesson-footer,
    .me-site-header,
    .me-footer-meta {
      flex-direction: column;
      align-items: start;
    }

    .me-title {
      font-size: clamp(32px, 10vw, 46px);
    }

    .me-app {
      padding: 20px 14px 32px;
    }

    .me-hero,
    .me-card {
      padding: 24px;
    }
  }
`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolvePageLabel(pageKey: HostH5PageKey): string {
  switch (pageKey) {
    case "login":
      return "Home";
    case "identityUpgrade":
      return "Upgrade Account";
    case "identityBindPhone":
      return "Bind Phone";
    case "identityMerge":
      return "Merge Accounts";
    case "overview":
      return "Overview";
    case "items":
      return "Today's Plan";
    case "feed":
      return "Discover";
    case "feedback":
      return "Feedback";
    case "mediaTools":
      return "Media Tools";
    case "messages":
      return "Inbox";
    case "settings":
      return "Preferences";
    case "account":
      return "Account";
    default:
      return buildGenericTitle(pageKey);
  }
}

function renderGlobalNavigation(pageKey: HostH5PageKey, authenticated: boolean): string {
  const entries: Array<{ key: HostH5PageKey; routeId: "auth.login" | "overview.index" | "items.list" | "feed.index" | "feedback.form" | "media-tools.workspace" | "messages.index" | "settings.index" | "account.index"; label: string }> = [
    { key: "login", routeId: "auth.login", label: "Home" },
    { key: "overview", routeId: "overview.index", label: "Overview" },
    { key: "items", routeId: "items.list", label: "Today's Plan" },
    { key: "feed", routeId: "feed.index", label: "Discover" },
    { key: "feedback", routeId: "feedback.form", label: "Feedback" },
    { key: "mediaTools", routeId: "media-tools.workspace", label: "Media Tools" },
    { key: "messages", routeId: "messages.index", label: "Inbox" },
    { key: "settings", routeId: "settings.index", label: "Preferences" },
    { key: "account", routeId: "account.index", label: "Account" },
  ];

  return entries
    .filter((entry) => authenticated || entry.key === "login")
    .map(
      (entry) =>
        `<button class="me-nav-button ${entry.key === pageKey ? "me-nav-button-active" : ""}" data-route-id="${entry.routeId}">${entry.label}</button>`,
    )
    .join("");
}

function renderFooterLinks(pageKey: HostH5PageKey, authenticated: boolean): string {
  const entries: Array<{ key: HostH5PageKey; routeId: "auth.login" | "overview.index" | "items.list" | "feed.index" | "feedback.form" | "media-tools.workspace" | "messages.index" | "settings.index" | "account.index"; label: string }> = [
    { key: "login", routeId: "auth.login", label: "Home" },
    { key: "overview", routeId: "overview.index", label: "Overview" },
    { key: "items", routeId: "items.list", label: "Today's Plan" },
    { key: "feed", routeId: "feed.index", label: "Discover" },
    { key: "feedback", routeId: "feedback.form", label: "Feedback" },
    { key: "mediaTools", routeId: "media-tools.workspace", label: "Media Tools" },
    { key: "messages", routeId: "messages.index", label: "Inbox" },
    { key: "settings", routeId: "settings.index", label: "Preferences" },
    { key: "account", routeId: "account.index", label: "Account" },
  ];

  return [
    ...entries
      .filter((entry) => authenticated || entry.key === "login")
      .map(
      (entry) =>
        `<button class="me-footer-link ${entry.key === pageKey ? "me-footer-link-active" : ""}" data-route-id="${entry.routeId}">${entry.label}</button>`,
    ),
    `<span class="me-footer-link me-footer-link-muted">Progress</span>`,
    `<span class="me-footer-link me-footer-link-muted">Search</span>`,
  ].join("");
}

type ShellTone = "landing" | "dashboard" | "execution" | "profile" | "neutral";

function resolveShellTone(pageKey: HostH5PageKey): ShellTone {
  switch (pageKey) {
    case "login":
      return "landing";
    case "overview":
    case "feed":
    case "feedback":
    case "mediaTools":
    case "messages":
      return "dashboard";
    case "items":
      return "execution";
    case "settings":
    case "account":
      return "profile";
    default:
      return "neutral";
  }
}

function buildHeaderShell(pageKey: HostH5PageKey, runtime: HostH5Runtime) {
  const itemsState = resolveStudyPageState(runtime);
  const tone = resolveShellTone(pageKey);

  if (tone === "landing") {
    return {
      className: "me-header-landing",
      brandCaption: "Editorial Landing",
      utilityPrimary: "Start with the story",
      utilitySecondary: "Search",
      utilityAccent: false,
    };
  }

  if (tone === "dashboard") {
    return {
      className: "me-header-dashboard",
      brandCaption: "Dashboard Workspace",
      utilityPrimary: `${itemsState.completedItemIds.length} completed`,
      utilitySecondary: "Snapshot view",
      utilityAccent: true,
    };
  }

  if (tone === "execution") {
    return {
      className: "me-header-execution",
      brandCaption: "Execution Workspace",
      utilityPrimary: `${itemsState.completedItemIds.length} completed`,
      utilitySecondary: "Queue live",
      utilityAccent: true,
    };
  }

  if (tone === "profile") {
    return {
      className: "me-header-profile",
      brandCaption: "Profile Settings",
      utilityPrimary: "Session controls",
      utilitySecondary: "Quiet profile view",
      utilityAccent: false,
    };
  }

  return {
    className: "",
    brandCaption: "Daily English Studio",
    utilityPrimary: `${itemsState.completedItemIds.length} completed`,
    utilitySecondary: "Search",
    utilityAccent: true,
  };
}

function buildFooterShell(pageKey: HostH5PageKey, runtime: HostH5Runtime) {
  const itemsState = resolveStudyPageState(runtime);
  const tone = resolveShellTone(pageKey);
  const currentPageLabel = resolvePageLabel(pageKey);
  const lastSaved = `Last saved progress: ${formatProgressTimestamp(itemsState.lastProgressAt)}`;

  if (tone === "landing") {
    return {
      className: "me-footer-landing",
      kicker: "Landing Flow",
      title: "Start with the product story, then move into the personal study flow.",
      text: "Use the footer links to browse the structure before you sign in. Once you begin, Overview becomes the working dashboard and Today's Plan becomes the execution surface.",
      linksTitle: "Explore",
      metaLeft: `Current page: ${currentPageLabel}`,
      metaRight: "Next stop: Overview",
    };
  }

  if (tone === "dashboard") {
    return {
      className: "me-footer-dashboard",
      kicker: "Dashboard Flow",
      title: "Overview keeps recommendation, progress, and navigation in one compact workspace.",
      text: "Use the footer links when you want to jump from summary into execution or move sideways into preferences without losing the current study context.",
      linksTitle: "Workspace Links",
      metaLeft: `Current page: ${currentPageLabel}`,
      metaRight: lastSaved,
    };
  }

  if (tone === "execution") {
    return {
      className: "me-footer-execution",
      kicker: "Execution Flow",
      title: "Today's Plan is the working surface for filters, completion state, and task execution.",
      text: "Use the footer links when you need to step back into Overview for a summary or move into preferences without dropping the active queue context.",
      linksTitle: "Execution Links",
      metaLeft: `Current page: ${currentPageLabel}`,
      metaRight: lastSaved,
    };
  }

  if (tone === "profile") {
    return {
      className: "me-footer-profile",
      kicker: "Profile Flow",
      title: "Preferences keeps study profile, account context, and session actions in a calmer settings view.",
      text: "Use the footer links when you want to move back into overview or today's plan, then return here when you need profile details or sign-out controls.",
      linksTitle: "Profile Links",
      metaLeft: `Current page: ${currentPageLabel}`,
      metaRight: lastSaved,
    };
  }

  return {
    className: "",
    kicker: "Minute English",
    title: "A compact study flow for vocabulary, listening, and speaking.",
    text: "Use the footer links to move across the product flow while keeping the shared progress state intact.",
    linksTitle: "Footer Links",
    metaLeft: `Current page: ${currentPageLabel}`,
    metaRight: lastSaved,
  };
}

function resolveStudyPageState(runtime: HostH5Runtime) {
  const overviewState = "overview" in runtime.pages ? runtime.pages.overview.store.getState() : null;
  const itemsState = runtime.pages.items.store.getState();

  if (overviewState && (overviewState.progressHydrated || overviewState.completedItemIds.length > 0)) {
    return overviewState;
  }

  return itemsState;
}

function isAuthenticated(runtime: HostH5Runtime): boolean {
  return Boolean(runtime.pages.login.store.getState().authenticated);
}

function bindRouteButtons(root: HTMLElement, runtime: HostH5Runtime, sync: () => void) {
  root.querySelectorAll<HTMLElement>("[data-route-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const routeId = button.dataset.routeId;
      if (!routeId) {
        return;
      }

      void runtime.kernel.router.toRoute(routeId).then(sync);
    });
  });
}

function renderApp(root: HTMLElement, title: string, runtime: HostH5Runtime, pageKey: HostH5PageKey, content: string) {
  document.title = title;
  const authenticated = isAuthenticated(runtime);
  const headerShell = buildHeaderShell(pageKey, runtime);
  const footerShell = buildFooterShell(pageKey, runtime);

  root.innerHTML = `
    <style>${APP_STYLES}</style>
    <div class="me-app me-app-${pageKey}">
      <main class="me-shell me-shell-layout">
        <header class="me-site-header ${headerShell.className}">
          <div class="me-brand-block">
            <button class="me-brand-button" data-route-id="auth.login">Minute English</button>
            <p class="me-brand-caption">${escapeHtml(headerShell.brandCaption)}</p>
          </div>
          <div class="me-site-nav">
            <div class="me-nav-group">
              ${renderGlobalNavigation(pageKey, authenticated)}
            </div>
            <span class="me-nav-divider" aria-hidden="true"></span>
            <div class="me-nav-utility">
              <span class="me-nav-utility-link ${headerShell.utilityAccent ? "me-nav-utility-link-accent" : ""}">${escapeHtml(authenticated ? headerShell.utilityPrimary : pageKey === "login" ? "Sign in to unlock pages" : headerShell.utilityPrimary)}</span>
              <span class="me-nav-utility-link">${escapeHtml(authenticated ? headerShell.utilitySecondary : pageKey === "login" ? "Home only before login" : headerShell.utilitySecondary)}</span>
            </div>
          </div>
        </header>

        ${content}

        <footer class="me-site-footer ${footerShell.className}">
          <div class="me-footer-grid">
            <div class="me-footer-copy">
              <p class="me-section-kicker">${escapeHtml(footerShell.kicker)}</p>
              <h2 class="me-footer-title">${escapeHtml(footerShell.title)}</h2>
              <p class="me-footer-text">${escapeHtml(footerShell.text)}</p>
            </div>
            <div class="me-footer-links">
              <p class="me-footer-links-title">${escapeHtml(footerShell.linksTitle)}</p>
              <div class="me-footer-link-list">
                ${renderFooterLinks(pageKey, authenticated)}
              </div>
            </div>
          </div>
          <div class="me-footer-meta">
            <span>${escapeHtml(footerShell.metaLeft)}</span>
            <span>${escapeHtml(footerShell.metaRight)}</span>
          </div>
        </footer>
      </main>
    </div>
  `;
}

function renderButton(
  id: string,
  label: string,
  variant: "primary" | "secondary" | "danger" | "ghost",
  disabled = false,
): string {
  return `<button id="${id}" class="me-button me-button-${variant}" ${disabled ? "disabled" : ""}>${label}</button>`;
}

function renderFilterButton(id: string, label: string, active: boolean): string {
  return `<button id="${id}" class="me-filter-button ${active ? "me-filter-button-active" : ""}">${label}</button>`;
}

function bindButton(root: HTMLElement, id: string, handler: () => void) {
  root.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener("click", handler);
}

function isPageWithStore(value: unknown): value is PageWithStore {
  return Boolean(value) && typeof (value as PageWithStore).store?.subscribe === "function";
}

function isPageWithReadyAction(value: unknown): value is PageWithReadyAction {
  return Boolean(value) && typeof (value as PageWithReadyAction).markReady === "function";
}

function buildGenericTitle(pageKey: string): string {
  return pageKey.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function hasOnShow(entry: HostH5PageEntry): entry is HostH5PageEntry & PageEntryWithShow {
  return typeof (entry as unknown as PageEntryWithShow).onShow === "function";
}

function filterItems(items: ItemsPageItem[], activeFilter: ItemsFilterValue): ItemsPageItem[] {
  switch (activeFilter) {
    case "completed":
      return items.filter((item) => item.completed);
    case "remaining":
      return items.filter((item) => !item.completed);
    default:
      return items;
  }
}

function formatProgressTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return "No progress saved yet";
  }

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "Saved just now";
  }
}

function findCurrentFocusItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return items.find((item) => !item.completed) ?? items[0];
}

function findLastCompletedItem(items: ItemsPageItem[]): ItemsPageItem | undefined {
  return [...items].reverse().find((item) => item.completed);
}

function buildResumeTaskLabel(task: ItemsPageItem | undefined, completedCount: number, remainingCount: number): string {
  if (!task) {
    return "Open Today's Plan";
  }

  if (remainingCount === 0) {
    return "Review Completed Lesson";
  }

  if (completedCount === 0) {
    return `Start ${task.title}`;
  }

  return `Resume ${task.title}`;
}

function buildResumeTaskDescription(
  task: ItemsPageItem | undefined,
  completedCount: number,
  remainingCount: number,
): string {
  if (!task) {
    return "Open today's plan to begin the lesson loop.";
  }

  if (remainingCount === 0) {
    return `Today's lesson is complete. Reopen ${task.title} for a quick review pass or revisit the finished queue.`;
  }

  if (completedCount === 0) {
    return `${task.title} is the first active step in today's lesson flow.`;
  }

  return `${task.title} is the next open task in the lesson sequence.`;
}

function resolveSelectedExecutionItem(items: ItemsPageItem[], selectedItemId?: string): ItemsPageItem | undefined {
  return items.find((item) => item.id === selectedItemId) ?? findCurrentFocusItem(items) ?? items[0];
}

function buildTaskChecklist(task: ItemsPageItem | undefined): string[] {
  switch (task?.categoryLabel) {
    case "Warm-up":
      return [
        "Scan the target words once before you try to remember them.",
        "Say each word aloud and notice the pronunciation rhythm.",
        "Choose one word you expect to reuse later in the lesson.",
      ];
    case "Input":
      return [
        "Read the short exchange once without stopping.",
        "Notice the key phrase that links the dialogue together.",
        "Check how the warm-up vocabulary appears in context.",
      ];
    case "Practice":
      return [
        "Rebuild each sentence from the lesson phrases.",
        "Pause for one second before answering so recall stays active.",
        "Keep one corrected pattern ready for the speaking step.",
      ];
    case "Speaking":
      return [
        "Say each line out loud at a steady pace.",
        "Repeat the line once more with more natural rhythm.",
        "Keep the phrase intact before trying to improvise.",
      ];
    case "Wrap-up":
      return [
        "Fix one mistake you noticed during the lesson.",
        "Repeat the key phrase once without looking.",
        "End the lesson with one short confidence check.",
      ];
    default:
      return [
        "Read the task once before acting on it.",
        "Complete the step with one clear focus point in mind.",
        "Keep one phrase or correction ready for the next task.",
      ];
  }
}

function buildTaskOutcome(task: ItemsPageItem | undefined): string {
  if (!task) {
    return "Open a task to see its lesson detail and execution notes.";
  }

  switch (task.categoryLabel) {
    case "Warm-up":
      return "Goal: activate the vocabulary that anchors the rest of today's lesson.";
    case "Input":
      return "Goal: understand how the target words behave inside a real mini-dialogue.";
    case "Practice":
      return "Goal: move the language from recognition into active recall.";
    case "Speaking":
      return "Goal: turn the lesson into spoken output while the patterns are still fresh.";
    case "Wrap-up":
      return "Goal: end with one correction and one phrase you can carry into tomorrow.";
    default:
      return "Goal: complete the current step cleanly before moving to the next task.";
  }
}

function ensureItemsProgress(runtime: HostH5Runtime, sync: () => void) {
  const targets = [runtime.pages.items, "overview" in runtime.pages ? runtime.pages.overview : null].filter(
    (target): target is HostH5Runtime["pages"]["items"] => target !== null,
  );

  for (const target of targets) {
    const state = target.store.getState();
    if (state.progressHydrated) {
      continue;
    }

    void target.hydrateProgress().then(sync);
  }
}

function scheduleRecentCompletionReset(runtime: HostH5Runtime, sync: () => void) {
  const { recentlyCompletedItemId } = runtime.pages.items.store.getState();
  if (!recentlyCompletedItemId || typeof window === "undefined") {
    return;
  }

  if (completionAnimationTimer !== null) {
    window.clearTimeout(completionAnimationTimer);
  }

  completionAnimationTimer = window.setTimeout(() => {
    completionAnimationTimer = null;
    runtime.pages.items.clearRecentCompletion();
    sync();
  }, 820);
}

function createGenericRenderer(pageKey: HostH5PageKey): HostH5PageRenderer {
  return {
    render({ root, runtime, sync }) {
      const page = (runtime.pages as Record<string, unknown>)[pageKey];
      const state = isPageWithStore(page) ? ((page.store.getState() ?? {}) as { ready?: unknown }) : {};
      const title = buildGenericTitle(pageKey);
      const ready = Boolean(state.ready);

      renderApp(
        root,
        title,
        runtime,
        pageKey,
        `
          <section class="me-screen">
            <section class="me-surface me-card">
              <p class="me-eyebrow">MiniX Host</p>
              <h1 class="me-card-title">${escapeHtml(title)}</h1>
              <p class="me-card-subtitle">Placeholder host page scaffolded for ${escapeHtml(title)}.</p>
              <p class="me-message">Ready: ${ready ? "yes" : "no"}</p>
              <div class="me-action-group">
                ${isPageWithReadyAction(page) ? renderButton("ready", "Mark Ready", "primary") : ""}
              </div>
            </section>
          </section>
        `,
      );

      bindRouteButtons(root, runtime, sync);
      bindButton(root, "ready", () => {
        void Promise.resolve(isPageWithReadyAction(page) ? page.markReady() : undefined).then(sync);
      });
    },
  };
}

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

function renderIdentityWorkflowPage(
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

function renderLoginPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.login.store.getState();
  const redirectDestinationLabel = state.redirectLabel ?? (state.redirectTarget ? buildGenericTitle(String(state.redirectTarget)) : null);
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

function renderOverviewPage({ root, runtime, sync }: HostH5PageRenderContext) {
  ensureItemsProgress(runtime, sync);
  const state = runtime.pages.overview.store.getState();
  const completedCount = state.items.filter((item) => item.completed).length;
  const remainingCount = state.items.length - completedCount;
  const isLessonComplete = state.items.length > 0 && remainingCount === 0;
  const progressPercent = state.items.length === 0 ? 0 : Math.round((completedCount / state.items.length) * 100);
  const recommendedNext = findCurrentFocusItem(state.items);
  const lastCompletedItem = findLastCompletedItem(state.items);
  const resumeTaskLabel = buildResumeTaskLabel(recommendedNext ?? lastCompletedItem, completedCount, remainingCount);
  const resumeTaskDescription = buildResumeTaskDescription(recommendedNext ?? lastCompletedItem, completedCount, remainingCount);
  const overviewRecommendationTitle = isLessonComplete
    ? "Today's lesson is complete. Use Overview to reopen the finished flow, review the wrap-up, or head back into the plan for a recap pass."
    : state.featuredReason ?? "Today's plan moves from vocabulary to listening and then active speaking.";
  const overviewRecommendationPoints = isLessonComplete
    ? [
        `All ${state.items.length} visible tasks are now complete`,
        "Overview has shifted from progress tracking to review guidance",
        "Open Today's Plan to revisit any completed step without restarting the session",
      ]
    : [
        `${remainingCount} tasks still open in today's study flow`,
        "Use Overview to choose the next best task before opening the full plan",
        "Preferences stays one step away for reminder and goal review",
      ];
  const snapshotTitle = isLessonComplete
    ? "Today's lesson is complete and ready to review"
    : `${progressPercent}% of today's visible study flow is complete`;
  const snapshotNote = isLessonComplete
    ? "You finished the single-lesson loop. Open Today's Plan to review the completed queue, revisit the wrap-up, or keep this session as today's finished lesson."
    : "Overview is a dashboard, not the execution page. Open Today's Plan when you are ready to work through the full queue.";
  const focusSectionKicker = isLessonComplete ? "Completed lesson" : "Today's focus";
  const focusSectionTitle = isLessonComplete ? "Finished lesson preview" : "Recommended next items";
  const focusSectionSubtitle = isLessonComplete
    ? "A recap view of the completed lesson so you can see what was finished before reopening the full queue."
    : "A quick preview of the lesson queue so you can decide where to continue without jumping straight into the full task list.";
  const resumeSectionKicker = isLessonComplete ? "Lesson Complete" : "Resume From Last Task";
  const resumeCardTitle = isLessonComplete
    ? "Completed lesson ready for recap"
    : recommendedNext?.title ?? lastCompletedItem?.title ?? "Resume today's plan";
  const resumeStageValue = isLessonComplete
    ? "Review Mode"
    : recommendedNext?.categoryLabel ?? lastCompletedItem?.categoryLabel ?? "Overview";
  const resumeEffortValue = isLessonComplete
    ? `${state.items.length || 0} tasks done`
    : recommendedNext?.durationMinutes
      ? `${recommendedNext.durationMinutes} min`
      : lastCompletedItem?.durationMinutes
        ? `${lastCompletedItem.durationMinutes} min`
        : "10 min";
  const resumeReason = isLessonComplete
    ? lastCompletedItem?.recommendedReason ??
      "Reopen the finished lesson while the sequence is still fresh, then revisit any stage you want to reinforce."
    : recommendedNext?.recommendedReason;
  const previewMarkup = state.items
    .slice(0, 3)
    .map(
      (item, index) => `
        <article class="me-lesson-card ${item.completed ? "me-lesson-card-complete" : ""}">
          <div class="me-lesson-meta">
            <span class="me-lesson-index">Focus ${index + 1}</span>
            <span class="me-lesson-badge ${item.completed ? "me-lesson-badge-complete" : ""}">${item.completed ? "Completed" : item.categoryLabel ?? "Today"}</span>
          </div>
          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="me-lesson-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
          ${
            item.recommendedReason
              ? `<p class="me-lesson-reason">${escapeHtml(item.recommendedReason)}</p>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  renderApp(
    root,
    "Your Daily English Overview",
    runtime,
    "overview",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-overview-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Overview</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Start here after home to understand today's focus, current progress, and the fastest next action.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">Session active</span>
              <span class="me-chip me-chip-accent">${isLessonComplete ? "Lesson complete" : `${completedCount}/${state.items.length || 0} complete`}</span>
              <span class="me-chip">${escapeHtml(isLessonComplete ? "Ready to review" : recommendedNext?.categoryLabel ?? "Lesson Flow")}</span>
              <span class="me-chip me-chip-warm">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</span>
            </div>
          </div>
          <aside class="me-panel me-overview-panel">
            <p class="me-panel-kicker">Today's recommendation</p>
            <h2 class="me-panel-title">${escapeHtml(overviewRecommendationTitle)}</h2>
            <ul class="me-panel-list">
              ${overviewRecommendationPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </aside>
        </section>

        <section class="me-stat-grid me-overview-stats">
          <article class="me-stat-card">
            <p class="me-stat-value">${state.items.length}</p>
            <p class="me-stat-label">Today's visible tasks</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${completedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Completed in this lesson" : "Completed today"}</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${isLessonComplete ? "Ready" : remainingCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Lesson review state" : "Recommended next actions"}</p>
          </article>
        </section>

        <section class="me-surface me-progress-card me-overview-progress">
          <div class="me-progress-row">
            <div class="me-progress-copy">
              <p class="me-section-kicker">Daily snapshot</p>
              <h2 class="me-progress-title">${escapeHtml(snapshotTitle)}</h2>
              <p class="me-progress-note">
                ${escapeHtml(snapshotNote)}
              </p>
            </div>
            <div class="me-progress-pill">${progressPercent}%</div>
          </div>
          <div class="me-progress-track" aria-hidden="true">
            <span class="me-progress-fill" style="width:${progressPercent}%"></span>
          </div>
          <div class="me-action-group">
            ${renderButton("overview-open-plan", resumeTaskLabel, "primary")}
            ${renderButton("overview-open-settings", "Learning Preferences", "secondary")}
          </div>
        </section>

        <section class="me-grid me-grid-columns me-overview-workspace">
          <section class="me-surface me-card me-overview-card">
            <p class="me-section-kicker">${escapeHtml(focusSectionKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(focusSectionTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(focusSectionSubtitle)}
            </p>
            ${
              state.loading && state.items.length === 0
                ? `<div class="me-empty-state">Loading your overview...</div>`
                : ""
            }
            ${
              state.errorText
                ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>`
                : ""
            }
            ${
              !state.loading && state.items.length === 0
                ? `<div class="me-empty-state">${escapeHtml(state.emptyText ?? "No overview tasks yet.")}</div>`
                : ""
            }
            ${state.items.length > 0 ? `<div class="me-lesson-list">${previewMarkup}</div>` : ""}
          </section>

          <section class="me-surface me-card me-overview-card">
            <p class="me-section-kicker">${escapeHtml(resumeSectionKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(resumeCardTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(resumeTaskDescription)}
            </p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(resumeStageValue)}</p>
                <p class="me-inline-metric-label">Current lesson stage</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(resumeEffortValue)}</p>
                <p class="me-inline-metric-label">Suggested effort</p>
              </div>
            </div>
            ${
              resumeReason
                ? `<p class="me-lesson-reason">${escapeHtml(resumeReason)}</p>`
                : ""
            }
            <div class="me-action-group">
              ${renderButton("overview-go-plan", resumeTaskLabel, "primary")}
              ${renderButton("overview-go-settings", "Open Preferences", "ghost")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "overview-open-plan", () => {
    void runtime.pages.overview.goToPlan().then(sync);
  });
  bindButton(root, "overview-open-settings", () => {
    void runtime.pages.overview.goToSettings().then(sync);
  });
  bindButton(root, "overview-go-plan", () => {
    void runtime.pages.overview.goToPlan().then(sync);
  });
  bindButton(root, "overview-go-settings", () => {
    void runtime.pages.overview.goToSettings().then(sync);
  });
}

function renderItemsPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.items.store.getState();
  const visibleItems = filterItems(state.items, state.activeFilter);
  const completedLoadedCount = state.items.filter((item) => item.completed).length;
  const remainingLoadedCount = state.items.length - completedLoadedCount;
  const isLessonComplete = state.items.length > 0 && remainingLoadedCount === 0;
  const progressPercent = state.items.length === 0 ? 0 : Math.round((completedLoadedCount / state.items.length) * 100);
  const currentFocusItem = findCurrentFocusItem(state.items);
  const lastCompletedItem = findLastCompletedItem(state.items);
  const selectedExecutionItem = resolveSelectedExecutionItem(state.items, state.selectedItemId);
  const selectedExecutionIndex = selectedExecutionItem ? state.items.findIndex((item) => item.id === selectedExecutionItem.id) : -1;
  const nextItemAfterSelection =
    selectedExecutionIndex >= 0
      ? state.items.slice(selectedExecutionIndex + 1).find((item) => !item.completed) ?? state.items.find((item) => !item.completed)
      : undefined;
  const nextRecommendedItem = state.recentlyCompletedItemId ? findCurrentFocusItem(state.items) : undefined;
  const featuredReason =
    state.featuredReason ?? "Today's plan is balanced to move from vocabulary to listening and then active speaking.";
  const lessonStatus = state.hasMore ? "More practice is available below." : "You are viewing the full lesson queue.";
  const activeFilterLabel =
    state.activeFilter === "completed" ? "Completed tasks only" : state.activeFilter === "remaining" ? "Remaining tasks only" : "All loaded tasks";
  const executionPanelTitle = isLessonComplete
    ? "The execution run is complete. Use this workspace to recap the finished queue or jump back to Overview for the completed lesson summary."
    : featuredReason;
  const executionPanelPoints = isLessonComplete
    ? [
        "All loaded lesson tasks are complete",
        "The queue is now in review mode until you reset progress",
        "Overview will present this session as a completed lesson that can be revisited",
      ]
    : [
        lessonStatus,
        `${remainingLoadedCount} tasks still open in the loaded lesson queue`,
        "Filtering, completion state, and recommendation text all come from the formal feature store",
      ];
  const executionStatusTitle = isLessonComplete
    ? "Lesson complete: the full loaded queue is finished"
    : `${completedLoadedCount} of ${state.items.length} loaded tasks completed`;
  const executionStatusNote = isLessonComplete
    ? "You reached the end of today's lesson loop. Review the finished queue, reopen the wrap-up, or return to Overview for a completed lesson recap."
    : "This page is the active workspace. Use it to execute tasks, change the visible queue, and save progress back into the shared state.";
  const lessonCompleteTitle = isLessonComplete
    ? `You completed all ${state.items.length} tasks in today's lesson`
    : "";
  const lessonCompleteNote =
    lastCompletedItem && isLessonComplete
      ? `${lastCompletedItem.title} closed the loop. Reopen the completed queue if you want a final review pass while the lesson sequence is still fresh.`
      : "All lesson steps are complete. Use the review actions below to revisit the finished flow.";
  const executionDetailKicker = isLessonComplete ? "Lesson Complete" : "Task Detail";
  const executionDetailTitle = isLessonComplete
    ? "Review the completed lesson"
    : selectedExecutionItem?.title ?? currentFocusItem?.title ?? lastCompletedItem?.title ?? "Today's plan is complete";
  const executionDetailSubtitle = isLessonComplete
    ? `Today's lesson is finished. Reopen ${lastCompletedItem?.title ?? "the final task"} for a recap pass or return to Overview to see the lesson marked complete.`
    : selectedExecutionItem?.subtitle ??
      selectedExecutionItem?.recommendedReason ??
      currentFocusItem?.recommendedReason ??
      (lastCompletedItem
        ? `All visible tasks are complete. Reopen ${lastCompletedItem.title} if you want a final review pass.`
        : "Load the lesson queue to start the execution flow.");
  const executionStageValue = isLessonComplete
    ? "Review Mode"
    : selectedExecutionItem?.categoryLabel ?? currentFocusItem?.categoryLabel ?? lastCompletedItem?.categoryLabel ?? "Execution";
  const executionEffortValue = isLessonComplete
    ? `${state.items.length || 0} tasks done`
    : selectedExecutionItem?.durationMinutes
      ? `${selectedExecutionItem.durationMinutes} min`
      : currentFocusItem?.durationMinutes
        ? `${currentFocusItem.durationMinutes} min`
        : lastCompletedItem?.durationMinutes
          ? `${lastCompletedItem.durationMinutes} min`
          : "10 min";

  scheduleRecentCompletionReset(runtime, sync);

  const itemsMarkup = visibleItems
    .map((item, index) => {
      const buttonId = `lesson-toggle-${item.id}`;
      const detailButtonId = `lesson-detail-${item.id}`;
      const isAnimating = state.recentlyCompletedItemId === item.id;
      return `
        <article class="me-lesson-card ${item.completed ? "me-lesson-card-complete" : ""} ${isAnimating ? "me-lesson-card-just-completed" : ""} ${selectedExecutionItem?.id === item.id ? "me-lesson-card-selected" : ""}">
          <div class="me-lesson-meta">
            <span class="me-lesson-index">Task ${index + 1}</span>
            <span class="me-lesson-badge ${item.completed ? "me-lesson-badge-complete" : ""}">${item.completed ? "Completed" : "Today"}</span>
          </div>
          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="me-lesson-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
          <div class="me-lesson-tags">
            ${item.categoryLabel ? `<span class="me-lesson-tag">${escapeHtml(item.categoryLabel)}</span>` : ""}
            ${item.difficultyLabel ? `<span class="me-lesson-tag">${escapeHtml(item.difficultyLabel)}</span>` : ""}
            ${item.durationMinutes ? `<span class="me-lesson-tag">${escapeHtml(String(item.durationMinutes))} min</span>` : ""}
          </div>
          ${
            item.recommendedReason
              ? `<p class="me-lesson-reason">${escapeHtml(item.recommendedReason)}</p>`
              : ""
          }
          <div class="me-lesson-footer">
            <p class="me-lesson-status">${item.completed ? "Saved in your formal study progress state." : "Mark this task complete when you finish it."}</p>
            <div class="me-lesson-actions">
              ${renderButton(detailButtonId, selectedExecutionItem?.id === item.id ? "Focused" : "View Details", selectedExecutionItem?.id === item.id ? "ghost" : "secondary")}
              ${renderButton(buttonId, item.completed ? "Completed" : "Mark Complete", item.completed ? "ghost" : "secondary")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  renderApp(
    root,
    "Today's English Practice",
    runtime,
    "items",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-execution-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Today's Plan</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Complete a few short tasks to build vocabulary, listening, and speaking confidence.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">10 min plan</span>
              <span class="me-chip me-chip-accent">${completedLoadedCount}/${state.items.length || 0} complete</span>
              <span class="me-chip me-chip-warm">${activeFilterLabel}</span>
            </div>
          </div>
          <aside class="me-panel me-execution-panel">
            <p class="me-panel-kicker">Execution note</p>
            <h2 class="me-panel-title">${escapeHtml(executionPanelTitle)}</h2>
            <ul class="me-panel-list">
              ${executionPanelPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </aside>
        </section>

        <section class="me-stat-grid me-execution-stats">
          <article class="me-stat-card">
            <p class="me-stat-value">${state.items.length || 0}</p>
            <p class="me-stat-label">Tasks in the execution queue</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${completedLoadedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Tasks completed in this lesson" : "Tasks completed in this run"}</p>
          </article>
          <article class="me-stat-card">
            <p class="me-stat-value">${isLessonComplete ? "Review" : remainingLoadedCount}</p>
            <p class="me-stat-label">${isLessonComplete ? "Queue state" : "Tasks still waiting"}</p>
          </article>
        </section>

        <section class="me-surface me-progress-card me-execution-progress">
          <div class="me-progress-row">
            <div class="me-progress-copy">
              <p class="me-section-kicker">Execution Status</p>
              <h2 class="me-progress-title">${escapeHtml(executionStatusTitle)}</h2>
              <p class="me-progress-note">
                ${escapeHtml(executionStatusNote)}
              </p>
            </div>
            <div class="me-progress-pill">${progressPercent}%</div>
          </div>
          <div class="me-progress-track" aria-hidden="true">
            <span class="me-progress-fill" style="width:${progressPercent}%"></span>
          </div>
          ${
            state.recentlyCompletedItemId && nextRecommendedItem
              ? `<div class="me-empty-state">Next recommended task unlocked: <strong>${escapeHtml(nextRecommendedItem.title)}</strong>. ${escapeHtml(nextRecommendedItem.recommendedReason ?? "Continue while the lesson context is still fresh.")}</div>`
              : ""
          }
          <div class="me-action-group">
            ${state.items.length > 0 && completedLoadedCount < state.items.length ? renderButton("mark-all", "Mark All Loaded Complete", "secondary") : ""}
            ${renderButton("reset-progress", "Reset Progress", "ghost")}
          </div>
        </section>

        ${
          isLessonComplete
            ? `
        <section class="me-surface me-card me-summary-card">
          <p class="me-section-kicker">Lesson Complete</p>
          <h2 class="me-card-title">${escapeHtml(lessonCompleteTitle)}</h2>
          <p class="me-card-subtitle">${escapeHtml(lessonCompleteNote)}</p>
          <div class="me-inline-metrics">
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${completedLoadedCount}</p>
              <p class="me-inline-metric-label">Tasks completed</p>
            </div>
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${escapeHtml(lastCompletedItem?.categoryLabel ?? "Wrap-up")}</p>
              <p class="me-inline-metric-label">Final lesson stage</p>
            </div>
            <div class="me-inline-metric">
              <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</p>
              <p class="me-inline-metric-label">Completion saved</p>
            </div>
          </div>
          <div class="me-action-group">
            ${renderButton("lesson-review", "Review Completed Queue", "primary")}
            ${renderButton("lesson-overview", "Back to Overview", "secondary")}
          </div>
        </section>
        `
            : ""
        }

        <section class="me-grid me-grid-columns me-execution-workspace">
          <section class="me-surface me-card me-execution-queue">
            <p class="me-section-kicker">Task Queue</p>
            <h2 class="me-card-title">Execute the visible lesson queue</h2>
            <p class="me-card-subtitle">
              Filter the queue, mark work complete, and keep the execution surface focused on the tasks that matter right now.
            </p>
            <div class="me-filter-row">
              ${renderFilterButton("filter-all", "All", state.activeFilter === "all")}
              ${renderFilterButton("filter-remaining", "Remaining", state.activeFilter === "remaining")}
              ${renderFilterButton("filter-completed", "Completed", state.activeFilter === "completed")}
            </div>
            ${
              state.loading && state.items.length === 0
                ? `<div class="me-empty-state">Loading today's lesson...</div>`
                : ""
            }
            ${
              state.errorText
                ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>`
                : ""
            }
            ${
              !state.loading && visibleItems.length === 0
                ? `<div class="me-empty-state">${state.activeFilter === "completed" ? "No completed tasks yet. Finish one lesson to see it here." : state.activeFilter === "remaining" ? "All loaded tasks are complete. Nice work." : escapeHtml(state.emptyText ?? "No lesson tasks yet.")}</div>`
                : ""
            }
            ${visibleItems.length > 0 ? `<div class="me-lesson-list">${itemsMarkup}</div>` : ""}
          </section>

          <section class="me-surface me-card me-execution-controls">
            <p class="me-section-kicker">${escapeHtml(executionDetailKicker)}</p>
            <h2 class="me-card-title">${escapeHtml(executionDetailTitle)}</h2>
            <p class="me-card-subtitle">
              ${escapeHtml(executionDetailSubtitle)}
            </p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(executionStageValue)}</p>
                <p class="me-inline-metric-label">Current stage</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(executionEffortValue)}</p>
                <p class="me-inline-metric-label">Suggested effort</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(state.lastProgressAt))}</p>
                <p class="me-inline-metric-label">Last progress save</p>
              </div>
            </div>
            ${
              selectedExecutionItem?.recommendedReason
                ? `<p class="me-lesson-reason">${escapeHtml(selectedExecutionItem.recommendedReason)}</p>`
                : ""
            }
            ${
              selectedExecutionItem
                ? `<ul class="me-detail-list">${buildTaskChecklist(selectedExecutionItem)
                    .map((step) => `<li>${escapeHtml(step)}</li>`)
                    .join("")}</ul>`
                : ""
            }
            <p class="me-detail-note">${escapeHtml(buildTaskOutcome(selectedExecutionItem ?? currentFocusItem ?? lastCompletedItem))}</p>
            ${
              nextRecommendedItem
                ? `<p class="me-lesson-reason">Next up: ${escapeHtml(nextRecommendedItem.title)}. ${escapeHtml(nextRecommendedItem.subtitle ?? "Continue the lesson while the rhythm is still active.")}</p>`
                : ""
            }
            <div class="me-action-group">
              ${selectedExecutionItem && !selectedExecutionItem.completed ? renderButton("focus-complete-continue", "Complete + Continue", "primary") : ""}
              ${isLessonComplete ? renderButton("focus-review-queue", "Review Completed Queue", "secondary") : ""}
              ${isLessonComplete ? renderButton("focus-open-overview", "Back to Overview", "ghost") : ""}
              ${selectedExecutionItem?.completed && nextItemAfterSelection ? renderButton("focus-continue", `Continue to ${nextItemAfterSelection.title}`, "secondary") : ""}
              ${state.hasMore ? renderButton("load-more", state.loading ? "Loading more..." : "Show More Practice", "secondary", state.loading) : ""}
              ${renderButton("settings", "Learning Preferences", selectedExecutionItem && !selectedExecutionItem.completed ? "ghost" : "primary")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "filter-all", () => {
    void runtime.pages.items.setFilter("all").then(sync);
  });
  bindButton(root, "filter-remaining", () => {
    void runtime.pages.items.setFilter("remaining").then(sync);
  });
  bindButton(root, "filter-completed", () => {
    void runtime.pages.items.setFilter("completed").then(sync);
  });
  bindButton(root, "load-more", () => {
    void runtime.pages.items.loadMore().then(sync);
  });
  bindButton(root, "mark-all", () => {
    void runtime.pages.items.markItemsComplete(state.items.map((item) => item.id)).then(sync);
  });
  bindButton(root, "focus-complete-continue", () => {
    if (!selectedExecutionItem) {
      return;
    }

    void runtime.pages.items.completeItemAndContinue(selectedExecutionItem.id).then(sync);
  });
  bindButton(root, "focus-continue", () => {
    if (!nextItemAfterSelection) {
      return;
    }

    void runtime.pages.items.setSelectedItem(nextItemAfterSelection.id).then(sync);
  });
  bindButton(root, "lesson-review", () => {
    if (!lastCompletedItem) {
      return;
    }

    void runtime.pages.items.setFilter("completed").then(() => {
      void runtime.pages.items.setSelectedItem(lastCompletedItem.id).then(sync);
    });
  });
  bindButton(root, "lesson-overview", () => {
    void runtime.pages.items.goToOverview().then(sync);
  });
  bindButton(root, "focus-review-queue", () => {
    if (!lastCompletedItem) {
      return;
    }

    void runtime.pages.items.setFilter("completed").then(() => {
      void runtime.pages.items.setSelectedItem(lastCompletedItem.id).then(sync);
    });
  });
  bindButton(root, "focus-open-overview", () => {
    void runtime.pages.items.goToOverview().then(sync);
  });
  bindButton(root, "reset-progress", () => {
    void runtime.pages.items.clearProgress().then(sync);
  });
  visibleItems.forEach((item) => {
    bindButton(root, `lesson-detail-${item.id}`, () => {
      void runtime.pages.items.setSelectedItem(item.id).then(sync);
    });
    bindButton(root, `lesson-toggle-${item.id}`, () => {
      void runtime.pages.items.toggleItemCompletion(item.id).then(sync);
    });
  });
  bindButton(root, "settings", () => {
    void runtime.pages.items.goToSettings().then(sync);
  });
}

function renderSettingsSections(sections: SettingsPageModel["sections"]): string {
  return sections
    .map(
      (section) => `
        <section class="me-settings-section">
          ${section.title ? `<h3 class="me-settings-title">${escapeHtml(section.title)}</h3>` : ""}
          <div>
            ${section.items
              .map(
                (item) => `
                  <div class="me-settings-item">
                    <p class="me-settings-label">${escapeHtml(item.label)}</p>
                    ${item.value !== undefined ? `<p class="me-settings-value">${escapeHtml(String(item.value))}</p>` : ""}
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderSettingsPage({ root, runtime, sync }: HostH5PageRenderContext) {
  ensureItemsProgress(runtime, sync);
  const state = runtime.pages.settings.store.getState();
  const itemsState = runtime.pages.items.store.getState();

  renderApp(
    root,
    "Learning Preferences",
    runtime,
    "settings",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-profile-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Learning Profile</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">
              Review your study goal, pace, and current session status before returning to overview or today's plan.
            </p>
            <div class="me-chip-row">
              <span class="me-chip">A2 to B1</span>
              <span class="me-chip me-chip-accent">${itemsState.activeFilter} filter saved</span>
              <span class="me-chip me-chip-warm">${itemsState.completedItemIds.length} completed tasks</span>
            </div>
          </div>
          <aside class="me-panel me-profile-panel">
            <p class="me-panel-kicker">Session note</p>
            <h2 class="me-panel-title">${escapeHtml(itemsState.featuredReason ?? "This page reflects the same formal study state that powers the task list.")}</h2>
            <ul class="me-panel-list">
              <li>Study goal and pace feel explicit</li>
              <li>Progress is saved on this device and restored when you return</li>
              <li>Sign-out returns Home and closes the protected session</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns me-profile-workspace">
          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Preferences</p>
            <h2 class="me-card-title">Study profile</h2>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${itemsState.completedItemIds.length}</p>
                <p class="me-inline-metric-label">Completed tasks</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(formatProgressTimestamp(itemsState.lastProgressAt))}</p>
                <p class="me-inline-metric-label">Last progress save</p>
              </div>
            </div>
            <div class="me-settings-group">${renderSettingsSections(state.sections)}</div>
          </section>

          <section class="me-surface me-card me-profile-actions">
            <p class="me-section-kicker">Session control</p>
            <h2 class="me-card-title">Pause learning on this device</h2>
            <p class="me-card-subtitle">
              Sign out to end this session and return to Home without losing the saved study snapshot.
            </p>
            <div class="me-action-group">
              ${renderButton("clear-learning-progress", "Clear Saved Progress", "ghost")}
              ${renderButton("logout", "Sign Out", "danger")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "clear-learning-progress", () => {
    void runtime.pages.items.clearProgress().then(sync);
  });
  bindButton(root, "logout", () => {
    void runtime.pages.settings.logout().then(sync);
  });
}

function renderFeedPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.feed.store.getState() as FeedState;
  const recentKeywords = state.searchResults?.recentKeywords ?? state.recentKeywords;
  const hotKeywords = state.searchResults?.hotKeywords ?? [];
  const suggestionTerms = state.searchResults?.suggestionTerms ?? [];

  renderApp(
    root,
    "Discovery Feed",
    runtime,
    "feed",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Discover</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.searchQuery?.mode ?? "global")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(state.searchQuery?.domain ?? "feed")}</span>
              <span class="me-chip">${escapeHtml(`${state.searchResults?.total ?? state.items.length} results`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Search Surface</p>
            <h2 class="me-panel-title">Normalized shared output</h2>
            <ul class="me-panel-list">
              <li>${escapeHtml(`Keyword: ${state.searchQuery?.keyword || "None"}`)}</li>
              <li>${escapeHtml(`Active tag: ${state.activeTag ?? "all"}`)}</li>
              <li>${escapeHtml(`Sort: ${state.searchResults?.activeSortKey ?? "recommended"}`)}</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Search</p>
            <h2 class="me-card-title">Keyword and reusable terms</h2>
            <div class="me-action-group">
              <input id="feed-keyword" class="me-input" value="${escapeHtml(state.query.keyword)}" placeholder="Search discovery content" />
              <button id="feed-submit" class="me-button me-button-primary">Search</button>
              <button id="feed-clear" class="me-button me-button-secondary">Clear</button>
            </div>
            <div class="me-chip-row">
              ${hotKeywords.map((keyword) => `<button class="me-filter-button" data-feed-keyword="${escapeHtml(keyword)}">${escapeHtml(keyword)}</button>`).join("")}
            </div>
            ${
              recentKeywords.length > 0
                ? `
                  <div class="me-chip-row">
                    ${recentKeywords
                      .map((keyword) => `<button class="me-filter-button" data-feed-keyword="${escapeHtml(keyword)}">${escapeHtml(keyword)}</button>`)
                      .join("")}
                  </div>
                `
                : ""
            }
            ${
              suggestionTerms.length > 0
                ? `<p class="me-copy-muted">${escapeHtml(`Suggested next terms: ${suggestionTerms.join(", ")}`)}</p>`
                : ""
            }
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Filters</p>
            <h2 class="me-card-title">Content lanes</h2>
            <div class="me-chip-row">
              ${state.tags
                .map(
                  (tag) =>
                    `<button class="me-filter-button ${state.activeTag === tag.key || (!state.activeTag && tag.key === "all") ? "me-filter-button-active" : ""}" data-feed-tag="${tag.key}">${escapeHtml(tag.label)}</button>`,
                )
                .join("")}
            </div>
            <p class="me-copy-muted">${escapeHtml(state.featuredReason ?? "Shared feed reasoning appears here after the first result loads.")}</p>
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Results</p>
          <h2 class="me-card-title">Feed results</h2>
          ${
            state.items.length > 0
              ? `
                <div class="me-task-list">
                  ${state.items
                    .map(
                      (item) => `
                        <article class="me-task-card">
                          <p class="me-task-meta">${escapeHtml(item.eyebrow ?? item.tag ?? "Feed")}</p>
                          <h3 class="me-task-title">${escapeHtml(item.title)}</h3>
                          <p class="me-task-copy">${escapeHtml(item.subtitle ?? "")}</p>
                          <p class="me-task-copy">${escapeHtml(item.recommendedReason ?? "")}</p>
                          <div class="me-action-group">
                            <button class="me-button me-button-secondary" data-feed-open="${item.id}">Open</button>
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="me-empty">${escapeHtml(state.searchResults?.emptyText ?? state.emptyText)}</p>`
          }
          ${state.hasMore ? `<div class="me-action-group"><button id="feed-load-more" class="me-button me-button-ghost">Load more</button></div>` : ""}
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "feed-submit", () => {
    const keyword = root.querySelector<HTMLInputElement>("#feed-keyword")?.value ?? "";
    runtime.pages.feed.setKeyword(keyword);
    void runtime.pages.feed.submitSearch().then(sync);
  });
  bindButton(root, "feed-clear", () => {
    void runtime.pages.feed.clearSearch().then(sync);
  });
  bindButton(root, "feed-load-more", () => {
    void runtime.pages.feed.loadMore().then(sync);
  });
  root.querySelectorAll<HTMLElement>("[data-feed-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      void runtime.pages.feed.applyTag(button.dataset.feedTag).then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feed-keyword]").forEach((button) => {
    button.addEventListener("click", () => {
      const keyword = button.dataset.feedKeyword ?? "";
      runtime.pages.feed.setKeyword(keyword);
      void runtime.pages.feed.submitSearch().then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-feed-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.feedOpen;
      void runtime.pages.feed.openItem(itemId).then(sync);
    });
  });
}

function renderMediaToolsPage({ root, runtime, sync }: HostH5PageRenderContext) {
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

function renderFeedbackPage({ root, runtime, sync }: HostH5PageRenderContext) {
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

function renderMessagesPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.messages.store.getState() as MessagesState;
  const selectedThread =
    state.reservedThreads.find((thread) => thread.threadId === state.selectedThreadId) ?? state.reservedThreads[0];

  renderApp(
    root,
    "Inbox",
    runtime,
    "messages",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Inbox</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle ?? "Shared notifications and reserved conversation threads.")}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(`${state.unreadBadge.totalUnread} total unread`)}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(`${state.unreadBadge.notificationUnread} notices`)}</span>
              <span class="me-chip">${escapeHtml(`${state.unreadBadge.threadUnread} threads`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Unread Badge</p>
            <h2 class="me-panel-title">Shared message output</h2>
            <ul class="me-panel-list">
              ${state.unreadBadge.breakdown.map((entry) => `<li>${escapeHtml(`${entry.label}: ${entry.count}`)}</li>`).join("") || "<li>No unread breakdown entries</li>"}
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Filters</p>
            <h2 class="me-card-title">Notice filters and batch actions</h2>
            <div class="me-chip-row">
              ${(state.filters.find((group) => group.key === "type")?.options ?? [])
                .map(
                  (option) => `
                    <button class="me-filter-button ${state.activeType === option.key ? "me-filter-button-active" : ""}" data-message-type="${escapeHtml(option.key)}">
                      ${escapeHtml(`${option.label} (${option.count})`)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            <div class="me-chip-row">
              ${(state.filters.find((group) => group.key === "group")?.options ?? [])
                .map(
                  (option) => `
                    <button class="me-filter-button ${state.activeGroupKey === option.key ? "me-filter-button-active" : ""}" data-message-group="${escapeHtml(option.key)}">
                      ${escapeHtml(option.label)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            <div class="me-action-group">
              <button id="messages-toggle-unread" class="me-button ${state.onlyUnread ? "me-button-primary" : "me-button-secondary"}">
                ${state.onlyUnread ? "Showing unread only" : "Show unread only"}
              </button>
              <button id="messages-mark-selected" class="me-button me-button-secondary">Mark selected read</button>
              <button id="messages-mark-visible" class="me-button me-button-ghost">Mark visible read</button>
              <button id="messages-settings" class="me-button me-button-ghost">Open Preferences</button>
            </div>
            ${state.lastActionMessage ? `<p class="me-message">${escapeHtml(state.lastActionMessage)}</p>` : ""}
            ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
          </section>

          <section class="me-surface me-card">
            <p class="me-section-kicker">Reserved Threads</p>
            <h2 class="me-card-title">Conversation placeholders</h2>
            <div class="me-settings-group">
              ${state.reservedThreads
                .map(
                  (thread) => `
                    <button class="me-filter-button ${selectedThread?.threadId === thread.threadId ? "me-filter-button-active" : ""}" data-message-thread="${thread.threadId}">
                      ${escapeHtml(`${thread.title} (${thread.unreadCount})`)}
                    </button>
                  `,
                )
                .join("")}
            </div>
            ${
              selectedThread
                ? `
                  <section class="me-settings-section">
                    <h3 class="me-settings-title">${escapeHtml(selectedThread.type)}</h3>
                    <div class="me-settings-item">
                      <p class="me-settings-label">${escapeHtml(selectedThread.title)}</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.subtitle ?? "Reserved thread model for future delivery surfaces.")}</p>
                    </div>
                    <div class="me-settings-item">
                      <p class="me-settings-label">Participants</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.participantLabels.join(", "))}</p>
                    </div>
                    <div class="me-settings-item">
                      <p class="me-settings-label">Latest message</p>
                      <p class="me-settings-value">${escapeHtml(selectedThread.lastMessagePreview ?? "No preview available.")}</p>
                    </div>
                  </section>
                `
                : `<p class="me-empty">No reserved threads available.</p>`
            }
          </section>
        </section>

        <section class="me-surface me-card">
          <p class="me-section-kicker">Notifications</p>
          <h2 class="me-card-title">Notification list</h2>
          ${
            state.items.length > 0
              ? `
                <div class="me-lesson-list">
                  ${state.items
                    .map(
                      (item) => `
                        <article class="me-lesson-card ${item.id === state.selectedItemId ? "me-lesson-card-selected" : ""} ${item.receipt.read ? "" : "me-lesson-card-just-completed"}">
                          <div class="me-lesson-meta">
                            <span class="me-lesson-index">${escapeHtml(item.groupLabel)}</span>
                            <span class="me-lesson-badge ${item.receipt.read ? "me-lesson-badge-complete" : ""}">${escapeHtml(item.receipt.read ? "Read" : "Unread")}</span>
                          </div>
                          <h3 class="me-lesson-title">${escapeHtml(item.title)}</h3>
                          <p class="me-lesson-subtitle">${escapeHtml(item.summary)}</p>
                          ${
                            item.bodyPreview
                              ? `<p class="me-lesson-reason">${escapeHtml(item.bodyPreview)}</p>`
                              : ""
                          }
                          <div class="me-lesson-tags">
                            <span class="me-lesson-tag">${escapeHtml(item.type)}</span>
                            ${item.tagLabels.map((tag) => `<span class="me-lesson-tag">${escapeHtml(tag)}</span>`).join("")}
                          </div>
                          <div class="me-lesson-footer">
                            <p class="me-lesson-status">${escapeHtml(item.thread?.title ?? item.createdAt)}</p>
                            <div class="me-lesson-actions">
                              <button class="me-button me-button-secondary" data-message-select="${item.id}">Select</button>
                            </div>
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="me-empty">${escapeHtml(state.emptyText)}</p>`
          }
          ${state.hasMore ? `<div class="me-action-group"><button id="messages-load-more" class="me-button me-button-ghost">Load more</button></div>` : ""}
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "messages-toggle-unread", () => {
    void runtime.pages.messages.toggleUnreadOnly().then(sync);
  });
  bindButton(root, "messages-mark-selected", () => {
    void runtime.pages.messages.markSelectedRead().then(sync);
  });
  bindButton(root, "messages-mark-visible", () => {
    void runtime.pages.messages.markVisibleRead().then(sync);
  });
  bindButton(root, "messages-settings", () => {
    void runtime.pages.messages.goToSettings().then(sync);
  });
  bindButton(root, "messages-load-more", () => {
    void runtime.pages.messages.loadMore().then(sync);
  });
  root.querySelectorAll<HTMLElement>("[data-message-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.messageType;
      if (!type) {
        return;
      }

      void runtime.pages.messages.applyType(type as MessagesState["activeType"]).then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-group]").forEach((button) => {
    button.addEventListener("click", () => {
      void runtime.pages.messages.applyGroup(button.dataset.messageGroup ?? "all").then(sync);
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const notificationId = button.dataset.messageSelect;
      if (!notificationId) {
        return;
      }

      runtime.pages.messages.selectItem(notificationId);
      sync();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-message-thread]").forEach((button) => {
    button.addEventListener("click", () => {
      const threadId = button.dataset.messageThread;
      if (!threadId) {
        return;
      }

      runtime.pages.messages.selectThread(threadId);
      sync();
    });
  });
}

function renderAccountPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.account.store.getState() as AccountState;

  renderApp(
    root,
    "Account Center",
    runtime,
    "account",
    `
      <section class="me-screen">
        <section class="me-surface me-hero me-profile-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Account</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.subtitle)}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.authStatusLabel ?? "Session")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(state.sessionLabel ?? "Device session context")}</span>
            </div>
          </div>
          <aside class="me-panel me-profile-panel">
            <p class="me-panel-kicker">Identity</p>
            <h2 class="me-panel-title">${escapeHtml(state.nickname ?? "Guest")}</h2>
            <ul class="me-panel-list">
              ${state.sections
                .slice(0, 2)
                .flatMap((section) => section.items.slice(0, 2))
                .map((item) => `<li>${escapeHtml(`${item.label}: ${String(item.value ?? "")}`)}</li>`)
                .join("")}
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns me-profile-workspace">
          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Summary</p>
            <h2 class="me-card-title">Account snapshot</h2>
            <div class="me-inline-metrics">
              ${state.stats
                .map(
                  (stat) => `
                    <div class="me-inline-metric">
                      <p class="me-inline-metric-value">${escapeHtml(stat.value)}</p>
                      <p class="me-inline-metric-label">${escapeHtml(stat.label)}</p>
                    </div>
                  `,
                )
                .join("")}
            </div>
            ${state.copyFeedback ? `<p class="me-message">${escapeHtml(state.copyFeedback)}</p>` : ""}
            ${state.errorText ? `<p class="me-message me-message-error">${escapeHtml(state.errorText)}</p>` : ""}
            <div class="me-action-group">
              <button id="account-copy" class="me-button me-button-secondary">Copy User ID</button>
              <button id="account-settings" class="me-button me-button-secondary">Open Preferences</button>
              <button id="account-overview" class="me-button me-button-ghost">Open Overview</button>
              ${state.identityWorkflows?.canUpgradeGuest ? renderButton("account-identity-upgrade", "Upgrade Guest", "primary") : ""}
              ${state.identityWorkflows?.canBindPhone ? renderButton("account-bind-phone", "Bind Phone", "primary") : ""}
              ${state.identityWorkflows?.mergePending ? renderButton("account-identity-merge", "Review Merge", "primary") : ""}
            </div>
          </section>

          <section class="me-surface me-card me-profile-card">
            <p class="me-section-kicker">Details</p>
            <h2 class="me-card-title">Shared user domain output</h2>
            ${state.sections
              .map(
                (section) => `
                  <section class="me-settings-section">
                    <h3 class="me-settings-title">${escapeHtml(section.title)}</h3>
                    <div>
                      ${section.items
                        .map(
                          (item) => `
                            <div class="me-settings-item">
                              <p class="me-settings-label">${escapeHtml(item.label)}</p>
                              <p class="me-settings-value">${escapeHtml(String(item.value ?? ""))}</p>
                            </div>
                          `,
                        )
                        .join("")}
                    </div>
                  </section>
                `,
              )
              .join("")}
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "account-copy", () => {
    void runtime.pages.account.copyUserId().then(sync);
  });
  bindButton(root, "account-settings", () => {
    void runtime.pages.account.goToSettings().then(sync);
  });
  bindButton(root, "account-overview", () => {
    void runtime.pages.account.goToOverview().then(sync);
  });
  bindButton(root, "account-identity-upgrade", () => {
    void runtime.pages.account.goToIdentityUpgrade().then(sync);
  });
  bindButton(root, "account-bind-phone", () => {
    void runtime.pages.account.goToPhoneBinding().then(sync);
  });
  bindButton(root, "account-identity-merge", () => {
    void runtime.pages.account.goToIdentityMerge().then(sync);
  });
}

export const hostH5PageRenderers: Partial<Record<HostH5PageKey, HostH5PageRenderer>> = {
  login: {
    render(context) {
      renderLoginPage(context);
    },
  },
  identityUpgrade: {
    render(context) {
      renderIdentityWorkflowPage(context, {
        pageKey: "identityUpgrade",
        title: "Upgrade Account",
        eyebrow: "Identity Upgrade",
        subtitle: "Promote a guest session into a formal account with explicit merge preview when the verified identity already belongs elsewhere.",
        primaryButtonId: "identity-submit-upgrade",
        primaryButtonLabel: "Start Upgrade",
        phonePurpose: "guest_upgrade",
      });
    },
  },
  identityBindPhone: {
    render(context) {
      renderIdentityWorkflowPage(context, {
        pageKey: "identityBindPhone",
        title: "Bind Phone",
        eyebrow: "Phone Binding",
        subtitle: "Attach a verified phone to the WeChat account and require confirmation before cross-account data moves.",
        primaryButtonId: "identity-submit-bind-phone",
        primaryButtonLabel: "Bind Phone",
        phonePurpose: "phone_binding",
      });
    },
  },
  identityMerge: {
    render(context) {
      renderIdentityWorkflowPage(context, {
        pageKey: "identityMerge",
        title: "Merge Accounts",
        eyebrow: "Merge Preview",
        subtitle: "Review assets, sessions, messages, content, and feedback impact before confirming or cancelling safely.",
        primaryButtonId: "identity-submit-merge",
        primaryButtonLabel: "Confirm Pending Merge",
        phonePurpose: "phone_binding",
      });
    },
  },
  overview: {
    render(context) {
      renderOverviewPage(context);
    },
  },
  items: {
    render(context) {
      renderItemsPage(context);
    },
  },
  feed: {
    render(context) {
      renderFeedPage(context);
    },
  },
  feedback: {
    render(context) {
      renderFeedbackPage(context);
    },
  },
  mediaTools: {
    render(context) {
      renderMediaToolsPage(context);
    },
  },
  messages: {
    render(context) {
      renderMessagesPage(context);
    },
  },
  settings: {
    render(context) {
      renderSettingsPage(context);
    },
  },
  account: {
    render(context) {
      renderAccountPage(context);
    },
  },
};

export function resolveHostH5PageKey(pathname: string): HostH5PageKey {
  const pageEntry = Object.entries(HOST_H5_ROUTES).find(([, routePath]) => routePath === pathname);
  return (pageEntry?.[0] ?? "login") as HostH5PageKey;
}

export async function activateHostH5Page(entry: HostH5PageEntry): Promise<void> {
  if (hasOnShow(entry)) {
    await entry.onShow();
  }
}

export function renderHostH5Page(context: HostH5PageRenderContext): void {
  const renderer = hostH5PageRenderers[context.pageKey] ?? createGenericRenderer(context.pageKey);
  renderer.render(context);
}

export function subscribeHostH5Pages(runtime: HostH5Runtime, sync: () => void): Array<() => void> {
  return Object.values(runtime.pages)
    .filter(isPageWithStore)
    .map((page) => page.store.subscribe(() => sync()));
}

export const HOST_H5_APP_STYLES = `
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

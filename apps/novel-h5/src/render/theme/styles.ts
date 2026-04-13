const STYLE_ID = "novel-h5-shell-styles";

export const APP_STYLES = `
  :root {
    color-scheme: light;
    --nh-ink: #162033;
    --nh-muted: #5c6678;
    --nh-soft: #8f98a6;
    --nh-line: rgba(22, 32, 51, 0.08);
    --nh-cream: #f6efe4;
    --nh-paper: rgba(255, 255, 255, 0.9);
    --nh-panel: rgba(248, 245, 240, 0.95);
    --nh-accent: #8a5d3b;
    --nh-accent-soft: #c89d74;
    --nh-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--nh-ink);
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
    background:
      radial-gradient(circle at top left, rgba(248, 227, 193, 0.56), transparent 28%),
      radial-gradient(circle at top right, rgba(214, 226, 240, 0.48), transparent 30%),
      linear-gradient(180deg, #f5efe6 0%, #eef2f6 100%);
  }
  a { color: inherit; text-decoration: none; }
  button, input { font: inherit; }
  #app { min-height: 100vh; }
  .nh-shell { min-height: 100vh; padding: 24px 20px 48px; }
  .nh-layout { width: min(1200px, 100%); margin: 0 auto; display: grid; gap: 24px; }
  .nh-layout-immersive { width: min(1240px, 100%); }
  .nh-site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 24px;
    border: 1px solid var(--nh-line);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }
  .nh-brand { display: grid; gap: 2px; }
  .nh-brand-mark {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--nh-soft);
  }
  .nh-brand-title {
    font-size: 28px;
    letter-spacing: -0.05em;
    line-height: 1;
  }
  .nh-nav { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .nh-nav-link {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 13px;
    color: var(--nh-muted);
    letter-spacing: 0.03em;
  }
  .nh-nav-link-active { color: var(--nh-ink); font-weight: 700; }
  .nh-card {
    background: var(--nh-paper);
    border: 1px solid var(--nh-line);
    border-radius: 28px;
    padding: 24px;
    box-shadow: var(--nh-shadow);
    backdrop-filter: blur(12px);
  }
  .nh-panel {
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(22, 32, 51, 0.06);
    background: var(--nh-panel);
  }
  .nh-grid { display: grid; gap: 18px; }
  .nh-hero-copy { align-content: start; }
  .nh-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
    gap: 22px;
  }
  .nh-catalog-layout,
  .nh-detail-layout {
    display: grid;
    grid-template-columns: minmax(260px, 0.38fr) minmax(0, 1fr);
    gap: 22px;
  }
  .nh-detail-layout {
    grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.58fr);
    align-items: start;
  }
  .nh-section-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  .nh-sidebar-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    gap: 22px;
  }
  .nh-kicker {
    margin: 0 0 8px;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--nh-soft);
  }
  .nh-title {
    margin: 0;
    font-size: clamp(34px, 6vw, 64px);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }
  .nh-title-small {
    margin: 0;
    font-size: 26px;
    line-height: 1.06;
    letter-spacing: -0.04em;
  }
  .nh-stat-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }
  .nh-stat-panel {
    padding: 14px 16px;
    border-radius: 20px;
    background: rgba(250, 247, 242, 0.94);
    border: 1px solid rgba(22, 32, 51, 0.06);
  }
  .nh-stat-value {
    margin: 0;
    font-size: 28px;
    line-height: 1.05;
    letter-spacing: -0.05em;
  }
  .nh-copy, .nh-meta, .nh-note {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.72;
    color: var(--nh-muted);
  }
  .nh-note { color: var(--nh-accent); }
  .nh-actions, .nh-chip-row, .nh-toolbar, .nh-progress-row, .nh-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .nh-button {
    appearance: none;
    border: 0;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    background: var(--nh-ink);
    color: #fff;
    cursor: pointer;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 14px;
    font-weight: 700;
  }
  .nh-button-secondary {
    background: rgba(236, 240, 244, 0.96);
    color: var(--nh-ink);
    border: 1px solid var(--nh-line);
  }
  .nh-button-ghost {
    background: transparent;
    color: var(--nh-muted);
    border: 1px solid rgba(92, 102, 120, 0.18);
  }
  .nh-searchbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
  }
  .nh-input {
    min-height: 46px;
    padding: 0 16px;
    border-radius: 16px;
    border: 1px solid var(--nh-line);
    background: rgba(255, 255, 255, 0.92);
    color: var(--nh-ink);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 14px;
  }
  .nh-input:focus {
    outline: 2px solid rgba(138, 93, 59, 0.2);
    border-color: rgba(138, 93, 59, 0.3);
  }
  .nh-textarea {
    min-height: 148px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--nh-line);
    background: rgba(255, 255, 255, 0.92);
    color: var(--nh-ink);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    box-sizing: border-box;
    width: 100%;
  }
  .nh-textarea:focus {
    outline: 2px solid rgba(138, 93, 59, 0.2);
    border-color: rgba(138, 93, 59, 0.3);
  }
  .nh-cover {
    min-height: 320px;
    display: grid;
    align-content: end;
    gap: 12px;
    padding: 26px;
    border-radius: 28px;
    color: #f7efe7;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.24), transparent 30%),
      linear-gradient(145deg, rgba(17, 24, 39, 0.96) 0%, rgba(67, 51, 43, 0.88) 48%, rgba(158, 116, 72, 0.78) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 32px rgba(51, 37, 30, 0.18);
  }
  .nh-cover-title { margin: 0; font-size: clamp(28px, 4vw, 40px); line-height: 1.02; letter-spacing: -0.05em; }
  .nh-cover-copy, .nh-cover-kicker {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
  }
  .nh-cover-kicker { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(247, 239, 231, 0.72); }
  .nh-cover-copy { font-size: 14px; line-height: 1.7; color: rgba(247, 239, 231, 0.82); }
  .nh-promo-band {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    padding: 16px 18px;
    border-radius: 20px;
    background: rgba(249, 244, 237, 0.94);
    border: 1px solid rgba(138, 93, 59, 0.14);
  }
  .nh-chip {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(236, 240, 244, 0.96);
    color: #334155;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 12px;
    font-weight: 700;
  }
  .nh-item {
    display: grid;
    gap: 12px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid var(--nh-line);
    background: rgba(249, 247, 243, 0.96);
  }
  .nh-item-feature { grid-template-columns: minmax(112px, 140px) minmax(0, 1fr); align-items: start; }
  .nh-item-compact { grid-template-columns: minmax(88px, 108px) minmax(0, 1fr); align-items: start; }
  .nh-item-active {
    border-color: rgba(138, 93, 59, 0.32);
    box-shadow: inset 0 0 0 1px rgba(138, 93, 59, 0.12);
  }
  .nh-item-cover {
    min-height: 148px;
    padding: 14px;
    border-radius: 18px;
    display: grid;
    align-content: space-between;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.22), transparent 28%),
      linear-gradient(165deg, rgba(23, 32, 51, 0.96) 0%, rgba(77, 57, 46, 0.9) 54%, rgba(176, 132, 87, 0.82) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    color: rgba(248, 239, 231, 0.92);
  }
  .nh-item-cover-mark {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(248, 239, 231, 0.7);
  }
  .nh-item-cover-title {
    font-size: 22px;
    line-height: 1.02;
    letter-spacing: -0.04em;
  }
  .nh-item-highlight {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--nh-accent);
  }
  .nh-item-title { margin: 0; font-size: 24px; line-height: 1.08; letter-spacing: -0.04em; }
  .nh-item-subtitle, .nh-item-copy {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    color: var(--nh-muted);
    line-height: 1.68;
  }
  .nh-item-copy { font-size: 14px; }
  .nh-item-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    color: var(--nh-soft);
    font-size: 12px;
    letter-spacing: 0.04em;
  }
  .nh-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }
  .nh-meta-grid-wide {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  .nh-meta-block {
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(249, 247, 243, 0.96);
    border: 1px solid rgba(22, 32, 51, 0.06);
  }
  .nh-meta-label {
    margin: 0 0 6px;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--nh-soft);
  }
  .nh-meta-value { margin: 0; font-size: 18px; }
  .nh-section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }
  .nh-section-head-compact { margin-bottom: 0; }
  .nh-section-head-aside {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .nh-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(148, 163, 184, 0.16), rgba(148, 163, 184, 0.56), rgba(148, 163, 184, 0.16));
  }
  .nh-catalog-hero,
  .nh-detail-hero {
    overflow: hidden;
  }
  .nh-filter-rail,
  .nh-sticky-rail {
    position: sticky;
    top: 24px;
    align-self: start;
  }
  .nh-filter-group {
    display: grid;
    gap: 10px;
  }
  .nh-spotlight-card {
    display: grid;
    gap: 18px;
    padding: 20px;
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(252, 248, 241, 0.98) 0%, rgba(245, 239, 230, 0.96) 100%);
    border: 1px solid rgba(22, 32, 51, 0.06);
  }
  .nh-ranking-list,
  .nh-detail-action-grid {
    display: grid;
    gap: 12px;
  }
  .nh-detail-action-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .nh-ranking-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(22, 32, 51, 0.06);
    background: rgba(249, 247, 243, 0.94);
  }
  .nh-ranking-order {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(138, 93, 59, 0.1);
    color: var(--nh-accent);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  .nh-ranking-meta {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    color: var(--nh-soft);
    font-size: 13px;
  }
  .nh-lane-card {
    display: grid;
    gap: 12px;
    padding: 18px;
    border-radius: 20px;
    border: 1px solid rgba(22, 32, 51, 0.06);
    background: rgba(249, 247, 243, 0.94);
  }
  .nh-plan-card {
    display: grid;
    gap: 18px;
    padding: 20px;
    border-radius: 22px;
    border: 1px solid rgba(22, 32, 51, 0.08);
    background: rgba(249, 247, 243, 0.96);
  }
  .nh-plan-card-accent {
    background:
      linear-gradient(180deg, rgba(252, 248, 241, 0.98) 0%, rgba(246, 238, 227, 0.96) 100%);
    border-color: rgba(138, 93, 59, 0.18);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  .nh-plan-price-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px;
  }
  .nh-plan-price-subtitle {
    margin: 0;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nh-soft);
  }
  .nh-plan-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }
  .nh-plan-list li {
    padding-left: 18px;
    position: relative;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.68;
    color: var(--nh-muted);
  }
  .nh-plan-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 9px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(138, 93, 59, 0.72);
  }
  .nh-comparison-grid .nh-item {
    gap: 16px;
  }
  .nh-promise-stack {
    gap: 14px;
  }
  .nh-detail-summary {
    font-size: 16px;
    line-height: 1.85;
  }
  .nh-empty-state {
    padding: 24px;
    border-radius: 20px;
    background: rgba(249, 247, 243, 0.94);
    border: 1px dashed rgba(22, 32, 51, 0.1);
  }
  .nh-issue-panel {
    min-height: 0;
  }
  .nh-lock-banner, .nh-reader-banner {
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(138, 93, 59, 0.18);
    background: linear-gradient(180deg, rgba(250, 243, 236, 0.98), rgba(245, 236, 226, 0.96));
    display: grid;
    gap: 8px;
  }
  .nh-reader-shell {
    min-height: 100vh;
    display: grid;
    gap: 18px;
    position: relative;
  }
  .nh-reader-topbar, .nh-reader-toolbar {
    display: grid;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid var(--nh-line);
    backdrop-filter: blur(14px);
  }
  .nh-reader-topbar {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
  .nh-reader-topbar-main,
  .nh-reader-topbar-actions,
  .nh-reader-toolbar-cluster {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .nh-reader-topbar-main { display: grid; gap: 10px; }
  .nh-reader-topbar-actions { justify-content: flex-end; }
  .nh-reader-titlebar {
    margin: 0;
    font-size: 24px;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }
  .nh-reader-progress-track {
    height: 4px;
    border-radius: 999px;
    background: rgba(22, 32, 51, 0.08);
    overflow: hidden;
  }
  .nh-reader-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--nh-accent), var(--nh-accent-soft));
  }
  .nh-reader-surface {
    position: relative;
    display: grid;
    gap: 14px;
  }
  .nh-reader-sequence-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .nh-reader-sequence-card {
    display: grid;
    gap: 10px;
    padding: 18px 20px;
    border-radius: 22px;
    border: 1px solid rgba(22, 32, 51, 0.08);
    background: rgba(249, 247, 243, 0.92);
    box-shadow: 0 18px 40px rgba(22, 32, 51, 0.05);
  }
  .nh-reader-surface-gated .nh-reader-paper {
    filter: saturate(0.96) contrast(0.98);
  }
  .nh-reader-paper {
    padding: 40px min(7vw, 56px);
    border-radius: 28px;
    background: rgba(255, 253, 248, 0.98);
    border: 1px solid rgba(117, 102, 84, 0.12);
    box-shadow: 0 24px 50px rgba(32, 25, 18, 0.08);
  }
  .nh-reader-paper-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: start;
    margin-bottom: 24px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(117, 102, 84, 0.12);
  }
  .nh-reader-mode-pill,
  .nh-reader-current-pill {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(22, 32, 51, 0.06);
    color: var(--nh-muted);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .nh-reader-current-pill {
    background: rgba(138, 93, 59, 0.12);
    color: var(--nh-accent);
  }
  .nh-reader-paper-sepia { background: rgba(246, 238, 225, 0.98); }
  .nh-reader-paper-night {
    background: rgba(20, 24, 33, 0.98);
    border-color: rgba(255, 255, 255, 0.08);
    color: rgba(241, 245, 249, 0.94);
  }
  .nh-reader-paper-night .nh-copy,
  .nh-reader-paper-night .nh-meta,
  .nh-reader-paper-night .nh-note { color: rgba(203, 213, 225, 0.84); }
  .nh-reader-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 44px;
  }
  .nh-reader-paragraph {
    font-size: 18px;
    line-height: 1.95;
    margin-bottom: 1.15em;
  }
  .nh-reader-title {
    margin: 0 0 18px;
    font-size: clamp(30px, 4vw, 42px);
    letter-spacing: -0.05em;
    line-height: 1.04;
  }
  .nh-reader-access-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    pointer-events: none;
  }
  .nh-reader-access-card {
    width: min(520px, 100%);
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 249, 242, 0.96);
    border: 1px solid rgba(138, 93, 59, 0.18);
    box-shadow: 0 24px 50px rgba(32, 25, 18, 0.12);
    display: grid;
    gap: 14px;
    pointer-events: auto;
  }
  .nh-reader-panel {
    position: fixed;
    inset: 0;
    display: none;
    align-items: stretch;
    justify-content: flex-end;
    padding: 20px;
    background: rgba(9, 15, 26, 0.34);
    backdrop-filter: blur(8px);
    z-index: 40;
  }
  .nh-reader-panel.is-open {
    display: flex;
  }
  .nh-reader-panel-sheet {
    width: min(460px, 100%);
    height: calc(100vh - 40px);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(22, 32, 51, 0.08);
    box-shadow: 0 26px 60px rgba(15, 23, 42, 0.18);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  .nh-reader-panel-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    padding: 22px 22px 18px;
    border-bottom: 1px solid rgba(22, 32, 51, 0.08);
  }
  .nh-reader-panel-body {
    overflow: auto;
    padding: 20px 22px 24px;
    display: grid;
    gap: 16px;
  }
  .nh-reader-panel-loading {
    padding: 18px;
    border-radius: 18px;
    border: 1px dashed rgba(22, 32, 51, 0.12);
    background: rgba(248, 245, 240, 0.8);
    color: var(--nh-muted);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
  }
  .nh-reader-panel-summary {
    display: grid;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 20px;
    background: rgba(249, 247, 243, 0.94);
    border: 1px solid rgba(22, 32, 51, 0.06);
  }
  .nh-reader-toc-list,
  .nh-reader-chapter-list,
  .nh-reader-settings-grid {
    display: grid;
    gap: 12px;
  }
  .nh-reader-volume {
    display: grid;
    gap: 12px;
  }
  .nh-reader-volume-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }
  .nh-reader-chapter-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(22, 32, 51, 0.08);
    background: rgba(249, 247, 243, 0.94);
  }
  .nh-reader-chapter-item-active {
    border-color: rgba(138, 93, 59, 0.28);
    box-shadow: inset 0 0 0 1px rgba(138, 93, 59, 0.12);
  }
  .nh-reader-chapter-title {
    margin: 0;
    font-size: 18px;
    line-height: 1.16;
    letter-spacing: -0.03em;
  }
  .nh-reader-progress-control {
    display: grid;
    gap: 10px;
  }
  .nh-reader-progress-control input[type="range"] {
    width: 100%;
    accent-color: var(--nh-accent);
  }
  .nh-reader-setting-value {
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    color: var(--nh-muted);
    font-size: 14px;
    font-weight: 700;
  }
  .nh-footer-note {
    text-align: center;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
    color: var(--nh-soft);
    font-size: 13px;
  }
  @media (max-width: 920px) {
    .nh-hero-grid,
    .nh-sidebar-grid,
    .nh-catalog-layout,
    .nh-detail-layout,
    .nh-reader-columns,
    .nh-reader-sequence-strip,
    .nh-searchbar {
      grid-template-columns: 1fr;
    }
    .nh-site-header,
    .nh-section-head,
    .nh-promo-band { align-items: start; }
    .nh-reader-topbar {
      grid-template-columns: 1fr;
    }
    .nh-reader-paper-head,
    .nh-reader-chapter-item {
      grid-template-columns: 1fr;
    }
    .nh-title { font-size: 42px; }
    .nh-item-feature,
    .nh-item-compact { grid-template-columns: 1fr; }
    .nh-filter-rail,
    .nh-sticky-rail { position: static; }
  }
`;

export function ensureNovelH5Styles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = APP_STYLES;
  document.head.appendChild(style);
}

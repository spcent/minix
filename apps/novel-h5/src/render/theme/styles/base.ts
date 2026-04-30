export const novelH5BaseStyles = `:root {
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
`;

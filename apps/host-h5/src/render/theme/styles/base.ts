export const hostH5BaseStyles = `:root {
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
`;

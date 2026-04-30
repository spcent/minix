export const novelH5ComponentsStyles = `.nh-item-feature { grid-template-columns: minmax(112px, 140px) minmax(0, 1fr); align-items: start; }
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
`;

export const hostH5ComponentsStyles = `.me-progress-track {
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
`;

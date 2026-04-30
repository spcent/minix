export const hostH5PagesStyles = `.me-app-home .me-shell {
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

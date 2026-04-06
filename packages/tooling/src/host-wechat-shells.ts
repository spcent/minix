import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadHostPageManifestEntries } from "./host-page-manifests";
import { getHostAppSpec, listHostApps, resolveHostFile } from "./specs";

export interface HostWechatPageShellConfig {
  pageKey: string;
  miniprogramPage: string;
  registrationModule: string;
  navigationBarTitleText: string;
  enablePullDownRefresh: boolean;
  shellTemplate: string;
  shellStyle: string;
}

function assertHostWechatPageShellConfig(pageKey: string, entry: Partial<HostWechatPageShellConfig>): HostWechatPageShellConfig {
  if (
    !entry.miniprogramPage ||
    !entry.registrationModule ||
    !entry.navigationBarTitleText ||
    !entry.shellTemplate ||
    !entry.shellStyle
  ) {
    throw new Error(`incomplete WeChat shell config for page "${pageKey}"`);
  }

  return {
    pageKey,
    miniprogramPage: entry.miniprogramPage,
    registrationModule: entry.registrationModule,
    navigationBarTitleText: entry.navigationBarTitleText,
    enablePullDownRefresh: entry.enablePullDownRefresh ?? false,
    shellTemplate: entry.shellTemplate,
    shellStyle: entry.shellStyle,
  };
}

export async function loadHostWechatPageShells(
  repoRoot: string,
  hostAppName: string,
): Promise<HostWechatPageShellConfig[]> {
  await getHostAppSpec(repoRoot, hostAppName);
  const entries = await loadHostPageManifestEntries(repoRoot, hostAppName);
  return entries.map((entry) =>
    assertHostWechatPageShellConfig(entry.pageKey, entry as Partial<HostWechatPageShellConfig>),
  );
}

function buildHostWechatIndexTs(entry: HostWechatPageShellConfig): string {
  return `import "${entry.registrationModule}";\n`;
}

function buildHostWechatIndexJson(entry: HostWechatPageShellConfig): string {
  const config: Record<string, unknown> = {
    navigationBarTitleText: entry.navigationBarTitleText,
  };

  if (entry.enablePullDownRefresh) {
    config.enablePullDownRefresh = true;
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

function buildHostWechatIndexWxml(entry: HostWechatPageShellConfig): string {
  switch (entry.shellTemplate) {
    case "login":
      return `<view class="page">
  <view class="header-menu card landing-menu">
    <view class="brand-block">
      <view class="brand-title">Minute English</view>
      <view class="brand-subtitle">Home for a compact daily English routine across shared MiniX hosts</view>
    </view>
    <view class="menu-title">Landing Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-active">Home</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>

  <view class="hero landing-hero">
    <view class="eyebrow">Minute English</view>
    <view class="title">Build Everyday English in 10 Minutes</view>
    <view class="subtitle">A compact English routine for busy learners who want real vocabulary, useful listening, and steady speaking practice.</view>
  </view>

  <view class="card landing-card">
    <view class="section-label">Product promise</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">10 min</view>
        <view class="summary-label">Typical daily lesson length</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">5 tasks</view>
        <view class="summary-label">Short activities in one routine</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">Daily</view>
        <view class="summary-label">Designed for repeatable practice</view>
      </view>
    </view>
  </view>

  <view class="card landing-card">
    <view class="section-label">Lesson preview</view>
    <view class="subtitle">Home previews the product. Personal progress does not start here. After sign-in, Overview becomes the first learner dashboard.</view>

    <view class="item">
      <view class="item-meta">
        <view class="item-badge">Warm-up</view>
      </view>
      <view class="item-title">Travel Vocabulary</view>
      <view class="subtitle">8 useful words for airport and hotel check-in.</view>
    </view>

    <view class="item">
      <view class="item-meta">
        <view class="item-badge">Listen</view>
      </view>
      <view class="item-title">Listening Practice</view>
      <view class="subtitle">A 45-second dialogue built for daily situations.</view>
    </view>

    <view class="item">
      <view class="item-meta">
        <view class="item-badge">Speak</view>
      </view>
      <view class="item-title">Speak Out Loud</view>
      <view class="subtitle">Repeat 5 lines and practice natural rhythm before you finish.</view>
    </view>
  </view>

  <view class="card landing-card landing-cta">
    <view class="section-label">Start from Home</view>
    <view class="subtitle">{{authenticated ? (redirectTarget === 'overview' ? 'You are signed in. Continue back to Overview, or choose another unlocked page from Home.' : (redirectTarget === 'plan' ? 'You are signed in. Continue back to Today\\'s Plan, or choose another unlocked page from Home.' : (redirectTarget === 'preferences' ? 'You are signed in. Continue back to Preferences, or choose another unlocked page from Home.' : 'You are signed in. Home stays in place and the rest of the product unlocks through the menu and actions below.'))) : 'Home explains the product and previews the lesson shape. The rest of the product unlocks after sign-in.'}}</view>
    <view class="status-text">{{loading ? 'Preparing your lesson...' : (authenticated ? (redirectTarget === 'overview' ? 'Signed in. Continue to Overview.' : (redirectTarget === 'plan' ? 'Signed in. Continue to Today\\'s Plan.' : (redirectTarget === 'preferences' ? 'Signed in. Continue to Preferences.' : 'Signed in. Choose where to go next.'))) : 'Ready for today\\'s practice')}}</view>

    <button wx:if="{{!authenticated}}" class="button" type="primary" loading="{{loading}}" bindtap="onTapLogin">
      Sign In To Continue
    </button>

    <button wx:if="{{!authenticated}}" class="button" bindtap="onTapEnsureLogin">
      Restore Learning Session
    </button>

    <button wx:if="{{authenticated && redirectTarget === 'overview'}}" class="button" type="primary" bindtap="onTapContinueDestination">
      Continue to Overview
    </button>

    <button wx:if="{{authenticated && redirectTarget === 'plan'}}" class="button" type="primary" bindtap="onTapContinueDestination">
      Continue to Today's Plan
    </button>

    <button wx:if="{{authenticated && redirectTarget === 'preferences'}}" class="button" type="primary" bindtap="onTapContinueDestination">
      Continue to Preferences
    </button>

    <button wx:if="{{authenticated && !redirectTarget}}" class="button" type="primary" bindtap="onTapOverview">
      Open Overview
    </button>

    <button wx:if="{{authenticated}}" class="button" bindtap="onTapPlan">
      Open Today's Plan
    </button>

    <button wx:if="{{authenticated}}" class="button" bindtap="onTapSettings">
      Open Preferences
    </button>

    <view wx:if="{{errorMessage}}" class="subtitle">{{errorMessage}}</view>
    <view wx:if="{{noticeMessage}}" class="subtitle">{{noticeMessage}}</view>
  </view>

  <view class="card landing-card">
    <view class="section-label">Built for short study windows</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">Commute</view>
        <view class="summary-label">Quick input before work</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">Lunch</view>
        <view class="summary-label">One lightweight review block</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">Evening</view>
        <view class="summary-label">A short speaking reset</view>
      </view>
    </view>
  </view>

  <view class="footer-nav card landing-footer">
    <view class="footer-title">Explore Next</view>
    <view class="footer-copy">{{authenticated ? 'You are signed in. Stay on Home until you want to open Overview, Today\\'s Plan, or Preferences.' : 'Before login, Home is the only visible page. Sign in here to unlock the rest of the product flow.'}}</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-active">Home</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view wx:if="{{authenticated}}" class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>
</view>
`;
    case "overview":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Minute English</view>
      <view class="brand-subtitle">Personal dashboard for today's study focus and next action</view>
    </view>
    <view class="menu-title">Dashboard Menu</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-active">Overview</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">Overview</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">{{completedItemIds.length === items.length && items.length > 0 ? 'Today\\'s lesson is complete. Use Overview to review the finished flow and reopen any step for a recap pass.' : 'Start here after home to understand today\\'s focus, current progress, and the fastest next action.'}}</view>
    <view class="chip-row">
      <view class="plan-chip">{{completedItemIds.length === items.length && items.length > 0 ? 'Lesson complete' : '3-task preview'}}</view>
      <view class="plan-chip">{{completedItemIds.length === items.length && items.length > 0 ? 'Ready to review' : 'Dashboard first'}}</view>
      <view class="plan-chip">{{completedItemIds.length === items.length && items.length > 0 ? 'Recap available' : 'Plan one tap away'}}</view>
    </view>
  </view>

  <view class="card workspace-summary">
    <view class="section-label">Today's recommendation</view>
    <view class="subtitle">{{completedItemIds.length === items.length && items.length > 0 ? 'Today\\'s lesson is complete. Overview has shifted from progress tracking to review guidance.' : (featuredReason || 'Start with overview to understand today\\'s focus before opening the full lesson plan.')}}</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{items.length}}</view>
        <view class="summary-label">Visible tasks</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{completedItemIds.length === items.length && items.length > 0 ? 'Ready' : completedItemIds.length}}</view>
        <view class="summary-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Review state' : 'Completed now'}}</view>
      </view>
    </view>
  </view>

  <view class="card workspace-focus">
    <view class="section-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Completed lesson' : 'Today\\'s focus'}}</view>
    <view class="subtitle" wx:if="{{loading}}">Loading your overview...</view>
    <view class="subtitle" wx:if="{{errorText}}">{{errorText}}</view>
    <view class="subtitle" wx:if="{{!loading && items.length === 0 && emptyText}}">{{emptyText}}</view>
    <view class="subtitle" wx:if="{{!loading && !errorText && items.length > 0 && completedItemIds.length === items.length}}">The queue below is now a finished lesson preview. Reopen the plan when you want a quick recap.</view>

    <view wx:for="{{items}}" wx:key="id" class="item">
      <view class="item-meta">
        <view class="item-badge {{item.completed ? 'item-badge-complete' : ''}}">{{item.completed ? 'Completed' : (item.categoryLabel || 'Today')}}</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle" wx:if="{{item.subtitle}}">{{item.subtitle}}</view>
      <view class="reason-text" wx:if="{{item.recommendedReason}}">{{item.recommendedReason}}</view>
    </view>

    <button class="button" type="primary" bindtap="onTapPlan">{{completedItemIds.length === items.length && items.length > 0 ? 'Review Completed Lesson' : 'Open Today\\'s Plan'}}</button>
    <button class="button" bindtap="onTapSettings">Learning Preferences</button>
  </view>

  <view class="footer-nav card workspace-footer">
    <view class="footer-title">Workspace Links</view>
    <view class="footer-copy">{{completedItemIds.length === items.length && items.length > 0 ? 'Overview is now in recap mode. Open Today\\'s Plan to review the finished lesson, or stay here to confirm the session is complete.' : 'Overview is the dashboard layer. Use it to choose the next best step before opening the full plan.'}}</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-active">Overview</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>
</view>
`;
    case "items":
      return `<view class="page">
  <view class="header-menu card execution-menu">
    <view class="brand-block">
      <view class="brand-title">Minute English</view>
      <view class="brand-subtitle">Active execution workspace for today's lesson queue</view>
    </view>
    <view class="menu-title">Execution Menu</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view class="nav-chip nav-chip-active">Today's Plan</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>

  <view class="hero execution-hero">
    <view class="eyebrow">Today's Plan</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">{{completedItemIds.length === items.length && items.length > 0 ? 'You finished today\\'s lesson. This page is now the review surface for the completed queue and final wrap-up.' : 'Use this page as the execution surface for today\\'s tasks, completion state, and queue controls.'}}</view>
    <view class="chip-row">
      <view class="plan-chip">10 min plan</view>
      <view class="plan-chip">{{items.length}} tasks</view>
      <view class="plan-chip">{{completedItemIds.length === items.length && items.length > 0 ? 'Lesson complete' : 'Execution active'}}</view>
    </view>
  </view>

  <view class="card execution-summary">
    <view class="section-label">Execution status</view>
    <view class="subtitle">{{completedItemIds.length === items.length && items.length > 0 ? 'The single-lesson loop is complete. Reopen the finished queue, review the wrap-up, or step back to Overview for the completed lesson summary.' : (featuredReason || 'This execution queue moves from vocabulary to listening and then active speaking.')}}</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{completedItemIds.length}}</view>
        <view class="summary-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Tasks completed' : 'Completed now'}}</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{completedItemIds.length === items.length && items.length > 0 ? 'Review' : (hasMore ? 'More' : 'Ready')}}</view>
        <view class="summary-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Queue state' : 'Load state'}}</view>
      </view>
    </view>
  </view>

  <view class="card execution-complete" wx:if="{{completedItemIds.length === items.length && items.length > 0}}">
    <view class="section-label">Lesson Complete</view>
    <view class="title completion-title">You completed today&#39;s lesson</view>
    <view class="subtitle">The queue is now ready for review. Revisit the finished steps, reopen the wrap-up, or return to Overview for the recap state.</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{completedItemIds.length}}</view>
        <view class="summary-label">Tasks finished</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">Saved</view>
        <view class="summary-label">Lesson progress state</view>
      </view>
    </view>
    <button class="button" type="primary" bindtap="onTapOverview">Back to Overview</button>
  </view>

  <view class="card execution-queue">
    <view class="section-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Completed queue' : 'Task queue'}}</view>
    <view class="subtitle" wx:if="{{loading}}">Loading today's lesson...</view>
    <view class="subtitle" wx:if="{{errorText}}">{{errorText}}</view>
    <view class="subtitle" wx:if="{{!loading && items.length === 0 && emptyText}}">{{emptyText}}</view>
    <view class="subtitle" wx:if="{{!loading && !errorText && items.length > 0 && completedItemIds.length === items.length}}">All tasks are complete. Use this queue as a finished lesson recap.</view>

    <view wx:for="{{items}}" wx:key="id" class="item">
      <view class="item-meta">
        <view class="item-badge {{item.completed ? 'item-badge-complete' : ''}}">{{item.completed ? 'Completed' : 'Today'}}</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle" wx:if="{{item.subtitle}}">{{item.subtitle}}</view>
    </view>

    <button class="button" wx:if="{{hasMore}}" bindtap="onTapLoadMore">Show More Practice</button>
  </view>

  <view class="card execution-controls">
    <view class="section-label">{{completedItemIds.length === items.length && items.length > 0 ? 'Review controls' : 'Control panel'}}</view>
    <view class="subtitle">{{completedItemIds.length === items.length && items.length > 0 ? 'Use Overview for the completed lesson recap, or open preferences while keeping today\\'s finished session intact.' : 'Use Overview for the high-level dashboard, or open preferences without leaving the current study flow behind.'}}</view>
    <button class="button" bindtap="onTapOverview">Back to Overview</button>
    <button class="button" bindtap="onTapSettings">Learning Preferences</button>
  </view>

  <view class="footer-nav card execution-footer">
    <view class="footer-title">Execution Links</view>
    <view class="footer-copy">{{completedItemIds.length === items.length && items.length > 0 ? 'Today\\'s Plan has shifted into review mode. Step back to Overview for the completed lesson summary, or stay here to revisit the finished queue.' : 'Today\\'s Plan is the execution layer. Use it to work the queue, then step back to Overview when you want the summary view.'}}</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view class="nav-chip nav-chip-active">Today's Plan</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>
</view>
`;
    case "settings":
      return `<view class="page">
  <view class="header-menu card profile-menu">
    <view class="brand-block">
      <view class="brand-title">Minute English</view>
      <view class="brand-subtitle">Calmer profile and settings view for study setup, session status, and sign-out</view>
    </view>
    <view class="menu-title">Profile Menu</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view class="nav-chip nav-chip-active">Preferences</view>
    </view>
  </view>

  <view class="hero profile-hero">
    <view class="eyebrow">Learning Profile</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">Review your study goal, pace, and account status for this demo session.</view>
  </view>

  <view class="card profile-card">
    <view wx:for="{{sections}}" wx:for-item="section" wx:key="key">
      <view class="section-title" wx:if="{{section.title}}">{{section.title}}</view>
      <view wx:for="{{section.items}}" wx:key="key" class="item">
        <view class="item-title">{{item.label}}</view>
        <view class="subtitle" wx:if="{{item.value}}">{{item.value}}</view>
      </view>
    </view>
  </view>

  <view class="card profile-actions">
    <view class="section-title">Session Control</view>
    <view class="subtitle">Leave this page quiet and utility-focused. Use it for profile review, then move back into overview or today's plan when you are done.</view>
    <button class="button" bindtap="onTapOverview">Back to Overview</button>
    <button class="button" bindtap="onTapPlan">Back to Today's Plan</button>
    <button class="button" type="warn" bindtap="onTapLogout">Sign Out</button>
  </view>

  <view class="footer-nav card profile-footer">
    <view class="footer-title">Profile Links</view>
    <view class="footer-copy">You are reviewing preferences. Use Overview for the dashboard view, or go back to today's plan to keep practicing.</view>
    <view class="nav-row">
      <view class="nav-chip">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapOverview">Overview</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapPlan">Today's Plan</view>
      <view class="nav-chip nav-chip-active">Preferences</view>
    </view>
  </view>
</view>
`;
    case "generic":
      return `<view class="page">
  <view class="hero">
    <view class="eyebrow">MiniX Runtime Host</view>
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">Placeholder host page scaffolded for ${entry.navigationBarTitleText}.</view>
  </view>

  <view class="card">
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">Use this scaffold as the first host wrapper for the feature package.</view>
    <view class="status-chip">{{ready ? 'Ready' : 'Not ready yet'}}</view>

    <button class="button" type="primary" bindtap="onTapReady">
      Mark Ready
    </button>
  </view>
</view>
`;
    case "novel-detail":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Title dossier</view>
      <view class="brand-subtitle">Editorial detail, access cues, and re-entry actions kept on one mobile surface</view>
    </view>
    <view class="menu-title">Detail Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapCatalog">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapToc">TOC</view>
      <view class="nav-chip nav-chip-active">Detail</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">{{detail ? detail.categoryLabel : 'Novel detail'}}</view>
    <view class="title">{{detail ? detail.title : title}}</view>
    <view class="subtitle">{{detail ? (detail.subtitle || 'A title page should turn curiosity into reading intent, shelf intent, or membership intent.') : (errorText || 'Loading title dossier...')}}</view>
    <view class="chip-row" wx:if="{{detail}}">
      <view class="plan-chip">{{detail.status}}</view>
      <view class="plan-chip">{{accessBadgeLabel || (detail.requiresMembership ? 'Membership title' : 'Open title')}}</view>
      <view class="plan-chip" wx:if="{{detail.inBookshelf}}">On shelf</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Reading status</view>
    <view class="subtitle" wx:if="{{membershipMessage}}">{{membershipMessage}}</view>
    <view class="subtitle" wx:if="{{bookshelfNotice}}">{{bookshelfNotice}}</view>
    <view class="subtitle" wx:if="{{accessSummary}}">{{accessSummary}}</view>
    <view class="summary-row" wx:if="{{detail}}">
      <view class="summary-stat">
        <view class="summary-value">{{detail.chapterCount}}</view>
        <view class="summary-label">Chapters</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{detail.continueChapterId || detail.firstChapterId || 'Start'}}</view>
        <view class="summary-label">Resume route</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{detail.inBookshelf ? 'Shelf' : 'Direct'}}</view>
        <view class="summary-label">Return mode</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{detail.ratingScore || 'New'}}</view>
        <view class="summary-label">Reader score</view>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Primary actions</view>
    <button class="button" type="primary" bindtap="onTapContinue">{{primaryActionLabel || 'Continue reading'}}</button>
    <button class="button" bindtap="onTapRead">{{startActionLabel || 'Start from first chapter'}}</button>
    <button class="button" bindtap="onTapToc">Open TOC</button>
    <button wx:if="{{detail && !detail.inBookshelf}}" class="button" bindtap="onTapAddToBookshelf">Add to shelf</button>
    <button wx:if="{{detail && detail.inBookshelf}}" class="button" type="warn" bindtap="onTapRemoveFromBookshelf">Remove from shelf</button>
    <button wx:if="{{membershipLocked || (detail && detail.isTrial && !detail.isPurchased)}}" class="button" bindtap="onTapMembership">{{membershipActionLabel || 'Unlock membership'}}</button>
    <button class="button" bindtap="onTapCatalog">Back to home</button>
  </view>

  <view class="card" wx:if="{{detail}}">
    <view class="section-label">Story dossier</view>
    <view class="subtitle">{{detail.summary}}</view>
    <view class="subtitle" wx:if="{{detail.authorPresenceLabel}}">{{detail.authorPresenceLabel}}</view>
    <button class="button" bindtap="onTapToggleSummary">{{summaryExpanded ? 'Collapse summary' : 'Expand summary'}}</button>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{detail.author.name}}</view>
        <view class="summary-label">Author</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{detail.latestChapter ? detail.latestChapter.title : 'Pending'}}</view>
        <view class="summary-label">Latest chapter</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{detail.favoriteCount || detail.bookshelfCount || '0'}}</view>
        <view class="summary-label">Favorites</view>
      </view>
    </view>
  </view>

  <view class="card" wx:if="{{detail}}">
    <view class="section-label">Title signals</view>
    <view class="item">
      <view class="item-title">Reader reputation</view>
      <view class="subtitle">{{reputationSummary || (detail.ratingScore ? (detail.ratingScore + ' score · ' + (detail.ratingCount || 0) + ' ratings') : 'Reader sentiment will collect here once the title starts building social proof.')}}</view>
    </view>
    <view class="item">
      <view class="item-title">Update cadence</view>
      <view class="subtitle">{{cadenceSummary || detail.updateCadenceLabel || 'Release rhythm becomes visible here once the title establishes a stable cadence.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Update history</view>
      <view class="subtitle">{{detail.updateHistoryLabel || (detail.latestChapter ? ('Latest update · ' + detail.latestChapter.title) : 'Recent chapter motion becomes visible here once the title establishes a pattern.')}}</view>
    </view>
    <view class="item">
      <view class="item-title">Trial rule</view>
      <view class="subtitle">{{trialSummary || detail.trialRuleLabel || 'Access rules and trial boundaries will appear here.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Access explanation</view>
      <view class="subtitle">{{detail.accessRuleSummaryLabel || accessSummary || 'Access expectations should stay explicit before the reader or membership flow opens.'}}</view>
    </view>
  </view>

  <view wx:if="{{latestMilestoneTitle}}" class="card">
    <view class="section-label">Latest milestone</view>
    <view class="item-title">{{latestMilestoneTitle}}</view>
    <view class="subtitle">{{latestMilestoneCopy || 'The detail surface should remember the latest completed reading milestone, not only the next chapter to resume.'}}</view>
    <view wx:if="{{latestMilestoneSourceLabel}}" class="subtitle">{{latestMilestoneSourceLabel}}</view>
    <view wx:if="{{latestMilestoneRecencyLabel}}" class="subtitle">{{latestMilestoneRecencyLabel}}</view>
    <view wx:if="{{latestMilestoneMeta}}" class="subtitle">{{latestMilestoneMeta}}</view>
    <view wx:if="{{latestMilestoneReturnHint}}" class="subtitle">{{latestMilestoneReturnHint}}</view>
    <button class="button" type="primary" bindtap="onTapLatestMilestone">{{latestMilestoneReturnLabel || 'Resume milestone'}}</button>
  </view>

  <view wx:if="{{milestoneHistory.length > 0}}" class="card">
    <view class="section-label">Milestone history</view>
    <view wx:for="{{milestoneHistory}}" wx:key="title" class="item">
      <view class="item-badge item-badge-soft">{{item.typeLabel}}</view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.copy}}</view>
      <view class="subtitle">{{item.sourceLabel}}</view>
      <view wx:if="{{item.recencyLabel}}" class="subtitle">{{item.recencyLabel}}</view>
      <view wx:if="{{item.meta}}" class="subtitle">{{item.meta}}</view>
      <view class="subtitle">{{item.returnHint}}</view>
      <button class="button button-inline" data-value="{{index}}" bindtap="onTapMilestoneHistoryItem">{{item.returnLabel}}</button>
    </view>
  </view>

  <view class="card" wx:if="{{detail && detail.relatedNovels && detail.relatedNovels.length > 0}}">
    <view class="section-label">Related reads</view>
    <view class="subtitle">{{detail.relatedLaneLabel || 'Related titles should feel like a deliberate next step, not a generic carousel.'}}</view>
    <view wx:for="{{detail.relatedNovels}}" wx:key="id" class="item">
      <view class="item-meta">
        <view class="item-badge">{{item.categoryLabel}}</view>
        <view class="item-badge item-badge-soft">{{item.status}}</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.authorName}}</view>
      <view class="reason-text">{{item.highlight}}</view>
      <view class="button-row">
        <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapRelatedNovel">Open detail</button>
      </view>
    </view>
  </view>

  <view class="card" wx:if="{{detail}}">
    <view class="section-label">Bookshelf framing</view>
    <view class="subtitle">{{bookshelfSummary || 'The detail page should explain what changes once this title is added to shelf.'}}</view>
  </view>

  <view class="card" wx:if="{{detail}}">
    <view class="section-label">Author presence</view>
    <view class="subtitle">{{detail.authorPresenceLabel || detail.author.bio || 'Author framing should help the title feel deliberate before the first chapter opens.'}}</view>
    <view class="item">
      <view class="item-title">{{detail.author.name}}</view>
      <view class="subtitle">{{detail.author.bio || 'Author biography placeholder.'}}</view>
    </view>
  </view>
</view>
`;
    case "novel-toc":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Reading directory</view>
      <view class="brand-subtitle">Current, continue, read, and locked states should stay visible before the reader opens</view>
    </view>
    <view class="menu-title">TOC Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapCatalog">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapNovelDetail">Detail</view>
      <view class="nav-chip nav-chip-active">TOC</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">Directory</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">The chapter list should preserve reading position, not just structure.</view>
  </view>

  <view class="card">
    <view class="section-label">TOC snapshot</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{volumes.length}}</view>
        <view class="summary-label">Volumes</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{readChapterIds.length}}</view>
        <view class="summary-label">Read in trail</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{currentChapterId || 'None'}}</view>
        <view class="summary-label">Pinned highlight</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{currentVolumeId || 'Current'}}</view>
        <view class="summary-label">Current volume</view>
      </view>
    </view>
    <view class="subtitle">{{selectedChapterAccessSummary || (continueChapterId ? 'The directory should preserve both the saved continuation point and any chapter the reader just carried back into TOC.' : 'The directory is loading continuation context from the active reading trail.')}}</view>
    <view wx:if="{{currentVolumeProgressLabel}}" class="subtitle">{{currentVolumeProgressLabel}}</view>
    <view wx:if="{{currentVolumeSummary}}" class="subtitle">{{currentVolumeSummary}}</view>
    <button class="button" type="primary" bindtap="onTapOpenSelected">{{selectedChapterPrimaryActionLabel || 'Open selected chapter'}}</button>
    <button wx:if="{{currentChapterId}}" class="button" bindtap="onTapCurrentChapter">Back to current chapter</button>
    <button wx:if="{{selectedChapterLocked}}" class="button" bindtap="onTapMembership">{{selectedChapterMembershipActionLabel || 'Unlock membership'}}</button>
    <button class="button" bindtap="onTapNovelDetail">Back to detail</button>
  </view>

  <view class="card">
    <view class="section-label">Active reading program</view>
    <view class="item-title">{{currentVolumeProgressLabel || 'Volume progress will appear once a current lane exists.'}}</view>
    <view class="subtitle">{{currentVolumeSummary || 'The directory should explain which volume is still alive in the current reading run.'}}</view>
    <view wx:if="{{nextVolumeHandoffLabel}}" class="subtitle">{{nextVolumeHandoffLabel}}</view>
    <view class="subtitle">{{backlogReentryLabel || 'Backlog re-entry stays quiet until a finished volume exists.'}}</view>
  </view>

  <view wx:if="{{programMilestoneTitle}}" class="card">
    <view class="section-label">Volume milestone</view>
    <view class="item-title">{{programMilestoneTitle}}</view>
    <view class="subtitle">{{programMilestoneCopy || 'Completed volumes should remain first-class milestones inside the directory.'}}</view>
    <view wx:if="{{programMilestoneMeta}}" class="subtitle">{{programMilestoneMeta}}</view>
  </view>

  <view wx:for="{{volumes}}" wx:key="id" class="card">
    <view class="section-label">{{item.title}}</view>
    <view class="subtitle">{{currentVolumeId === item.id ? 'Current reading volume kept expanded for faster jump-back.' : (expandedVolumeId === item.id ? 'Expanded for chapter scanning.' : 'Collapsed to keep the long-session directory quieter.')}}</view>
    <button class="button" bindtap="onTapToggleVolume" data-value="{{item.id}}">{{expandedVolumeId === item.id ? 'Collapse volume' : 'Expand volume'}}</button>
    <view wx:if="{{expandedVolumeId === item.id}}" wx:for="{{item.chapters}}" wx:key="id" class="item">
      <view class="item-meta">
        <view class="item-badge">Ch. {{item.order}}</view>
        <view wx:if="{{currentChapterId === item.id}}" class="item-badge">Current</view>
        <view wx:if="{{highlightedChapterId === item.id}}" class="item-badge">Pinned</view>
        <view wx:if="{{continueChapterId === item.id}}" class="item-badge item-badge-soft">Continue</view>
        <view wx:if="{{item.isTrial}}" class="item-badge item-badge-soft">Trial</view>
        <view wx:if="{{item.requiresMembership && !item.isPurchased}}" class="item-badge item-badge-soft">Locked</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{currentChapterId === item.id ? 'Current resume point from the latest reading session.' : (highlightedChapterId === item.id ? 'Pinned highlight carried over from the reader session.' : (continueChapterId === item.id ? 'Saved continuation point for the active trail.' : (item.requiresMembership && !item.isPurchased ? 'Beyond the current membership boundary.' : 'Available to open from the directory.')))}}</view>
      <view class="button-row">
        <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapSelectChapter">Focus</button>
        <button class="button button-inline" type="primary" data-value="{{item.id}}" bindtap="onTapReadChapter">{{currentChapterId === item.id ? 'Resume' : 'Read'}}</button>
        <button wx:if="{{item.requiresMembership && !item.isPurchased}}" class="button button-inline" data-value="{{item.id}}" bindtap="onTapMembership">{{item.isTrial ? 'Unlock after trial' : 'Unlock'}}</button>
      </view>
    </view>
  </view>
</view>
`;
    case "novel-reader":
      return `<view class="page">
  <view class="header-menu card execution-menu">
    <view class="brand-block">
      <view class="brand-title">Live reader</view>
      <view class="brand-subtitle">Continuous reading, chapter completion, and return paths kept in one compact execution view</view>
    </view>
    <view class="menu-title">Reader Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapNovelDetail">Detail</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapToc">TOC</view>
      <view class="nav-chip nav-chip-active">Reader</view>
    </view>
  </view>

  <view class="hero execution-hero">
    <view class="eyebrow">{{currentVolumeTitle || 'Reader'}}</view>
    <view class="title">{{chapter ? chapter.title : title}}</view>
    <view class="subtitle">{{accessMessage || (nextChapterTitle ? ('Next up: ' + nextChapterTitle) : 'You are at the latest available chapter in this run.')}}</view>
    <view class="chip-row">
      <view class="plan-chip">{{Math.round(progressPercent * 100)}}% read</view>
      <view class="plan-chip">{{readChapterIds.length}} in trail</view>
      <view wx:if="{{sessionElapsedLabel}}" class="plan-chip">{{sessionElapsedLabel}}</view>
      <view class="plan-chip">{{accessBadgeLabel || accessState}}</view>
      <view wx:if="{{readingStateLabel}}" class="plan-chip">{{readingStateLabel}}</view>
    </view>
  </view>

  <view wx:if="{{displaySyncMessage}}" class="card">
    <view class="section-label">Display refresh</view>
    <view class="subtitle">{{displaySyncMessage}}</view>
  </view>

  <view class="card" wx:if="{{accessState !== 'open'}}">
    <view class="section-label">Access gate</view>
    <view class="subtitle">{{accessMessage || (accessState === 'trial' ? 'Trial preview is active for this chapter.' : 'This chapter is behind the current membership boundary.')}}</view>
    <view class="button-row">
      <button class="button button-inline" bindtap="onTapMembership">{{membershipActionLabel || (accessState === 'trial' ? 'Unlock after trial' : 'Unlock membership')}}</button>
      <button class="button button-inline" bindtap="onTapToc">Review directory</button>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Reading trail</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{currentVolumeTitle || 'Current'}}</view>
        <view class="summary-label">Volume lane</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{nextChapterTitle || 'Latest'}}</view>
        <view class="summary-label">Next up</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{saveStatusLabel || lastSavedAt || 'Unsaved'}}</view>
        <view class="summary-label">Save status</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{sessionElapsedLabel || 'Just opened'}}</view>
        <view class="summary-label">Session length</view>
      </view>
    </view>
    <view wx:if="{{volumeProgressLabel}}" class="subtitle">{{volumeProgressLabel}}</view>
    <view wx:if="{{activeProgramSummary}}" class="subtitle">{{activeProgramSummary}}</view>
    <view class="subtitle">{{nextStepLabel || (nextChapterTitle ? ('Next up: ' + nextChapterTitle) : 'No next chapter is currently available.')}}</view>
    <button class="button" type="primary" bindtap="onTapCompleteNext">{{nextChapterTitle ? 'Complete + Continue' : 'Mark Chapter Complete'}}</button>
    <button class="button" bindtap="onTapCompleteChapter">Save chapter complete</button>
    <button class="button" bindtap="onTapToc">Back to current chapter in TOC</button>
  </view>

  <view class="card">
    <view class="section-label">Backlog re-entry</view>
    <view class="subtitle">{{backlogReentryLabel || 'This run is still too early for backlog re-entry signals.'}}</view>
    <view wx:if="{{volumeHandoffLabel}}" class="subtitle">{{volumeHandoffLabel}}</view>
  </view>

  <view wx:if="{{programMilestoneTitle}}" class="card">
    <view class="section-label">Volume milestone</view>
    <view class="item-title">{{programMilestoneTitle}}</view>
    <view class="subtitle">{{programMilestoneCopy || 'Completed volumes should remain visible as stable milestones, not disappear behind chapter-level cues.'}}</view>
    <view wx:if="{{programMilestoneMeta}}" class="subtitle">{{programMilestoneMeta}}</view>
  </view>

  <view class="card" wx:if="{{chapterCompletionState !== 'reading'}}">
    <view class="section-label">Post-chapter recap</view>
    <view class="item-title">{{completionSummaryTitle || 'Reading recap'}}</view>
    <view class="subtitle">{{completionSummaryCopy || chapterCompletionMessage || 'The latest chapter action is saved and ready for the next step.'}}</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{completionSummaryMeta || 'Tracked'}}</view>
        <view class="summary-label">Trail summary</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{sessionElapsedLabel || 'Just opened'}}</view>
        <view class="summary-label">Session length</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{saveStatusLabel || 'Saved'}}</view>
        <view class="summary-label">Progress state</view>
      </view>
    </view>
    <button wx:if="{{nextChapterTitle}}" class="button" type="primary" bindtap="onTapNextChapter">Open next step</button>
    <button wx:if="{{!nextChapterTitle}}" class="button" type="primary" bindtap="onTapNovelDetail">Back to title dossier</button>
    <button class="button" bindtap="onTapToc">Review directory</button>
  </view>

  <view class="card" wx:if="{{chapterCompletionState === 'continued' && chapterCompletionMessage}}">
    <view class="section-label">Continuous reading</view>
    <view class="subtitle">{{chapterCompletionMessage}}</view>
    <button wx:if="{{nextChapterTitle}}" class="button" type="primary" bindtap="onTapCompleteNext">Keep reading forward</button>
    <button wx:if="{{!nextChapterTitle}}" class="button" type="primary" bindtap="onTapNovelDetail">Return to title dossier</button>
    <button class="button" bindtap="onTapToc">Review queue</button>
  </view>

  <view class="card" wx:if="{{chapterCompletionState === 'completed'}}">
    <view class="section-label">Chapter complete</view>
    <view class="subtitle">{{chapterCompletionMessage || (nextChapterTitle ? 'This chapter is complete. The next chapter is ready to open immediately.' : 'This chapter is complete. You are at the end of the current available run.')}}</view>
    <button wx:if="{{nextChapterTitle}}" class="button" type="primary" bindtap="onTapNextChapter">Open next chapter</button>
    <button wx:if="{{!nextChapterTitle}}" class="button" bindtap="onTapNovelDetail">Back to detail</button>
    <button class="button" bindtap="onTapToc">Open directory</button>
  </view>

  <view class="card">
    <view class="section-label">Reading surface</view>
    <view class="subtitle" wx:if="{{chapter}}">{{chapter.content}}</view>
    <view class="subtitle" wx:if="{{!chapter}}">{{errorText || 'Loading chapter content...'}}</view>
  </view>

  <view class="card">
    <view class="section-label">Reader actions</view>
    <view class="button-row">
      <button class="button button-inline" bindtap="onTapPreviousChapter">Previous</button>
      <button class="button button-inline" type="primary" bindtap="onTapNextChapter">Next</button>
      <button class="button button-inline" bindtap="onTapToc">Open TOC</button>
      <button class="button button-inline" bindtap="onTapNovelDetail">Detail</button>
    </view>
    <button class="button" bindtap="onTapBookshelf">Open bookshelf</button>
    <button wx:if="{{accessState !== 'open'}}" class="button" bindtap="onTapMembership">{{membershipActionLabel || 'Unlock membership'}}</button>
  </view>
</view>
`;
    case "novel-membership":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Membership center</view>
      <view class="brand-subtitle">Unlock state, plan choice, and return path should stay visible on one mobile surface</view>
    </view>
    <view class="menu-title">Membership Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapCatalog">Home</view>
      <view class="nav-chip nav-chip-active">Membership</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">{{source || 'direct'}}</view>
    <view class="title">{{overview ? overview.headline : title}}</view>
    <view class="subtitle">{{overview ? overview.subheadline : (lockedMessage || 'Loading membership state and return context...')}}</view>
    <view class="chip-row">
      <view class="plan-chip">{{overview ? overview.tier : 'guest'}}</view>
      <view class="plan-chip">{{overview ? overview.entitlementScope : 'none'}}</view>
      <view class="plan-chip">{{overview && overview.active ? 'Unlocked' : 'Locked'}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Unlock status</view>
    <view class="subtitle" wx:if="{{lockedMessage}}">{{lockedMessage}}</view>
    <view class="subtitle" wx:if="{{purchaseSuccessMessage}}">{{purchaseSuccessMessage}}</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{overview ? overview.statusLabel : 'Loading'}}</view>
        <view class="summary-label">Status</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{source || 'direct'}}</view>
        <view class="summary-label">Entry source</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{recommendedPlanId || 'quarterly'}}</view>
        <view class="summary-label">Recommended plan</view>
      </view>
    </view>
    <view class="subtitle" wx:if="{{entitlementSummary}}">{{entitlementSummary}}</view>
    <view class="subtitle" wx:if="{{unlockOutcomeLabel}}">{{unlockOutcomeLabel}}</view>
    <view class="subtitle" wx:if="{{returnContextLabel}}">{{returnContextLabel}}</view>
  </view>

  <view class="card" wx:if="{{overview && !overview.active}}">
    <view class="section-label">Plans</view>
    <view class="subtitle">{{unlockOutcomeLabel || 'The Mini Program should make the unlock promise explicit: pay once here, then return to the blocked flow with access already resolved.'}}</view>
    <view class="button-row">
      <button class="button button-inline" data-value="monthly" bindtap="onTapPurchaseMembership">{{purchasing && lastPurchasedPlanId === 'monthly' ? 'Unlocking...' : 'Unlock Monthly'}}</button>
      <button class="button button-inline" type="primary" data-value="quarterly" bindtap="onTapPurchaseMembership">{{purchasing && lastPurchasedPlanId === 'quarterly' ? 'Unlocking...' : 'Unlock Quarterly'}}</button>
      <button class="button button-inline" data-value="annual" bindtap="onTapPurchaseMembership">{{purchasing && lastPurchasedPlanId === 'annual' ? 'Unlocking...' : 'Unlock Annual'}}</button>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Conversion clarity</view>
    <view class="item">
      <view class="item-title">Recommended plan</view>
      <view class="subtitle">{{recommendedPlanId || 'quarterly'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Immediate unlock effect</view>
      <view class="subtitle">{{unlockOutcomeLabel || 'Membership purchase should immediately unlock the blocked premium flow.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Return path</view>
      <view class="subtitle">{{returnContextLabel || 'Return path should remain visible until the reader leaves this surface.'}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Stay in flow</view>
    <view class="item">
      <view class="item-title">Return without losing context</view>
      <view class="subtitle">{{returnContextLabel || 'The return path should stay visible until the reader re-enters the blocked surface.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Immediate, then calm</view>
      <view class="subtitle">{{unlockOutcomeLabel || 'Unlock should happen immediately, then the page should step back into a quiet recovery role.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Retention posture</view>
      <view class="subtitle">{{overview && overview.active ? 'Membership is already active, so this page should behave like quiet infrastructure instead of a repeated sales wall.' : 'Choose the plan that reduces repeat interruption for the reading cadence you actually keep.'}}</view>
    </view>
  </view>

  <view wx:if="{{latestMilestoneTitle}}" class="card">
    <view class="section-label">Latest milestone</view>
    <view class="item-title">{{latestMilestoneTitle}}</view>
    <view class="subtitle">{{latestMilestoneCopy || 'Premium continuity should remember the latest completed milestone as well as the next blocked step.'}}</view>
    <view wx:if="{{latestMilestoneSourceLabel}}" class="subtitle">{{latestMilestoneSourceLabel}}</view>
    <view wx:if="{{latestMilestoneRecencyLabel}}" class="subtitle">{{latestMilestoneRecencyLabel}}</view>
    <view wx:if="{{latestMilestoneMeta}}" class="subtitle">{{latestMilestoneMeta}}</view>
    <view wx:if="{{latestMilestoneReturnHint}}" class="subtitle">{{latestMilestoneReturnHint}}</view>
    <button class="button" bindtap="onTapLatestMilestone">{{latestMilestoneReturnLabel || 'Resume milestone'}}</button>
  </view>

  <view wx:if="{{milestoneHistory.length > 0}}" class="card">
    <view class="section-label">Milestone history</view>
    <view wx:for="{{milestoneHistory}}" wx:key="title" class="item">
      <view class="item-badge item-badge-soft">{{item.typeLabel}}</view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.copy}}</view>
      <view class="subtitle">{{item.sourceLabel}}</view>
      <view wx:if="{{item.recencyLabel}}" class="subtitle">{{item.recencyLabel}}</view>
      <view wx:if="{{item.meta}}" class="subtitle">{{item.meta}}</view>
      <view class="subtitle">{{item.returnHint}}</view>
      <button class="button button-inline" data-value="{{index}}" bindtap="onTapMilestoneHistoryItem">{{item.returnLabel}}</button>
    </view>
  </view>

  <view class="card" wx:if="{{overview && overview.benefits && overview.benefits.length > 0}}">
    <view class="section-label">Membership value</view>
    <view wx:for="{{overview.benefits}}" wx:key="key" class="item">
      <view class="item-title">{{item.label}}</view>
      <view class="subtitle">{{item.description}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Return actions</view>
    <button wx:if="{{overview && overview.active}}" class="button" type="primary" bindtap="onTapContinueAfterPurchase">{{returnActionLabel || 'Return to unlocked flow'}}</button>
    <button class="button" bindtap="onTapCatalog">{{overview && overview.active ? 'Back to home' : 'Back to catalog'}}</button>
  </view>
</view>
`;
    case "novel-catalog":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Quiet Frontlist</view>
      <view class="brand-subtitle">Editorial storefront with personal continuation kept near the top</view>
    </view>
    <view class="menu-title">Home Surface</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-active">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapBookshelf">Bookshelf</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">Personalized home</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">{{items.length > 0 ? (storefrontReason || 'The Mini Program home now leads with active reading momentum, not only frontlist discovery.') : 'Loading the frontlist and reading continuity...'}}</view>
  </view>

  <view class="card">
    <view class="section-label">Home snapshot</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{items.length}}</view>
        <view class="summary-label">Visible frontlist titles</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{query.keyword ? '1' : '0'}}</view>
        <view class="summary-label">Active search context</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{hasMore ? 'More' : 'Ready'}}</view>
        <view class="summary-label">Catalog continuation state</view>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Reading profile</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{selectedNovelId ? 'Resume-first' : 'Browse-first'}}</view>
        <view class="summary-label">Session mode</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{items.length > 0 ? items[0].categoryLabel : 'Frontlist'}}</view>
        <view class="summary-label">Primary lane</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{selectedNovelId ? 'Pinned' : 'Open'}}</view>
        <view class="summary-label">Current focus state</view>
      </view>
    </view>
    <view class="subtitle">{{selectedReason || (selectedNovelId ? 'A selected or active title exists, so Home should behave like a return surface before it behaves like a cold storefront.' : 'No active title is pinned yet, so Home can lean harder on editorial discovery and lane browsing.')}}</view>
  </view>

  <view wx:if="{{latestMilestoneTitle}}" class="card">
    <view class="section-label">Latest milestone</view>
    <view class="item-title">{{latestMilestoneTitle}}</view>
    <view class="subtitle">{{latestMilestoneCopy || 'The storefront should remember the latest completed reading milestone, not only the next unfinished return.'}}</view>
    <view wx:if="{{latestMilestoneSourceLabel}}" class="subtitle">{{latestMilestoneSourceLabel}}</view>
    <view wx:if="{{latestMilestoneRecencyLabel}}" class="subtitle">{{latestMilestoneRecencyLabel}}</view>
    <view wx:if="{{latestMilestoneMeta}}" class="subtitle">{{latestMilestoneMeta}}</view>
    <view wx:if="{{latestMilestoneReturnHint}}" class="subtitle">{{latestMilestoneReturnHint}}</view>
    <button class="button" type="primary" bindtap="onTapLatestMilestone">{{latestMilestoneReturnLabel || 'Resume milestone'}}</button>
  </view>

  <view wx:if="{{milestoneHistory.length > 0}}" class="card">
    <view class="section-label">Milestone history</view>
    <view wx:for="{{milestoneHistory}}" wx:key="title" class="item">
      <view class="item-badge item-badge-soft">{{item.typeLabel}}</view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.copy}}</view>
      <view class="subtitle">{{item.sourceLabel}}</view>
      <view wx:if="{{item.recencyLabel}}" class="subtitle">{{item.recencyLabel}}</view>
      <view wx:if="{{item.meta}}" class="subtitle">{{item.meta}}</view>
      <view class="subtitle">{{item.returnHint}}</view>
      <button class="button button-inline" data-value="{{index}}" bindtap="onTapMilestoneHistoryItem">{{item.returnLabel}}</button>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Continue lane</view>
    <view class="subtitle">WeChat home should expose active reading continuity before asking the reader to browse again.</view>
    <view wx:if="{{items.length === 0 && !loading}}" class="subtitle">{{errorText || 'No visible titles yet.'}}</view>
    <view wx:for="{{items}}" wx:key="id">
      <view wx:if="{{item.continueChapterId}}" class="item">
        <view class="item-meta">
          <view class="item-badge">Resume</view>
          <view wx:if="{{item.requiresMembership}}" class="item-badge item-badge-soft">Premium</view>
        </view>
        <view class="item-title">{{item.title}}</view>
        <view class="subtitle">{{item.recommendedReason || item.continueChapterTitle || item.latestChapterTitle || 'Saved reading position available'}}</view>
        <view class="button-row">
          <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapSelectNovel">Focus</button>
          <button class="button button-inline" type="primary" data-value="{{item.id}}" bindtap="onTapContinueNovel">Resume</button>
          <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapOpenNovel">Open</button>
        </view>
      </view>
    </view>
    <button class="button" type="primary" bindtap="onTapOpenSelected">Open selected title</button>
    <button class="button" bindtap="onTapBookshelf">Open bookshelf</button>
  </view>

  <view class="card">
    <view class="section-label">Editor's desk</view>
    <view class="subtitle">{{storefrontReason || 'Recommendation lanes should explain why discovery is arranged this way, not just expose a stack of cards.'}}</view>
    <view class="item">
      <view class="item-title">Because you read...</view>
      <view class="subtitle">{{continueReason || (selectedNovelId ? 'The selected title remains near the top because it still carries the strongest continuation signal.' : 'No title is pinned yet, so the lead slot stays editorial and frontlist-driven.')}}</view>
    </view>
    <view class="item">
      <view class="item-title">Recently updated on your shelf</view>
      <view class="subtitle">{{updateReason || (items.length > 0 ? (items[0].latestChapterTitle || 'Watch the active serial lane for fresh releases.') : 'Once titles load, recent updates and serial movement can be surfaced here.')}}</view>
    </view>
    <view class="item">
      <view class="item-title">Frontlist note</view>
      <view class="subtitle">{{frontlistReason || 'One title should still explain why it anchors discovery right now, even on a compact WeChat surface.'}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Frontlist selection</view>
    <view class="subtitle">{{frontlistReason || 'Discovery stays visible, but the page should no longer feel anonymous after reading progress exists.'}}</view>
    <view wx:for="{{items}}" wx:key="id" class="item">
      <view class="item-meta">
        <view class="item-badge">{{item.categoryLabel}}</view>
        <view class="item-badge item-badge-soft">{{item.status}}</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.recommendedReason || item.summary}}</view>
      <view class="button-row">
        <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapSelectNovel">Focus</button>
        <button class="button button-inline" type="primary" data-value="{{item.id}}" bindtap="onTapContinueNovel">Resume</button>
        <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapOpenNovel">Open</button>
      </view>
    </view>
    <button wx:if="{{hasMore}}" class="button" bindtap="onTapLoadMore">Load More</button>
  </view>

  <view class="card">
    <view class="section-label">Storefront programming</view>
    <view class="item">
      <view class="item-title">Storefront note</view>
      <view class="subtitle">{{storefrontReason || 'The home surface should explain why it behaves like a storefront instead of a cold catalog list.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Serial lane</view>
      <view class="subtitle">{{serialReason || 'The serial lane should explain why ongoing publication cadence matters right now.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Ranking lane</view>
      <view class="subtitle">{{rankingReason || 'The ranking lane should behave like a quick confidence signal for browsing readers.'}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Membership radar</view>
    <view class="subtitle">{{membershipReason || 'Premium titles should stay visible as a quiet merchandising lane instead of interrupting the storefront rhythm.'}}</view>
    <view wx:for="{{items}}" wx:key="id">
      <view wx:if="{{item.requiresMembership}}" class="item">
        <view class="item-meta">
          <view class="item-badge">Membership</view>
          <view class="item-badge item-badge-soft">{{item.categoryLabel}}</view>
        </view>
        <view class="item-title">{{item.title}}</view>
        <view class="subtitle">{{item.recommendedReason || membershipReason || item.summary}}</view>
        <view class="button-row">
          <button class="button button-inline" data-value="{{item.id}}" bindtap="onTapOpenNovel">Open detail</button>
        </view>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Recommendation lanes</view>
    <view class="subtitle">Use shared reasons so the Mini Program home explains the same programming logic as H5.</view>
    <view class="item">
      <view class="item-title">Because you read...</view>
      <view class="subtitle">{{continueReason || 'Saved progress should surface the fastest route back into flow.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Recently updated on your shelf</view>
      <view class="subtitle">{{updateReason || 'Recent chapter movement should remain visible without scanning the full frontlist.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Membership lane</view>
      <view class="subtitle">{{membershipReason || 'Premium discovery should remain legible without taking over the home surface.'}}</view>
    </view>
  </view>

  <view class="footer-nav card workspace-footer">
    <view class="footer-title">Workspace links</view>
    <view class="footer-copy">Use Home for discovery and quick continuation. Move to Bookshelf when sorting, filtering, or focused return paths matter more.</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-active">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapBookshelf">Bookshelf</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>
</view>
`;
    case "novel-bookshelf":
      return `<view class="page">
  <view class="header-menu card workspace-menu">
    <view class="brand-block">
      <view class="brand-title">Shelf Workspace</view>
      <view class="brand-subtitle">Sorting, filtering, and selected-title continuation for active reading loops</view>
    </view>
    <view class="menu-title">Bookshelf Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapCatalog">Home</view>
      <view class="nav-chip nav-chip-active">Bookshelf</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>

  <view class="hero workspace-hero">
    <view class="eyebrow">Bookshelf workspace</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">The shelf should now feel like an active workspace: recent reading first, updates visible, and completed runs one filter away.</view>
  </view>

  <view class="card">
    <view class="section-label">Shelf snapshot</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{activeCount}}</view>
        <view class="summary-label">Active titles</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{updatedCount}}</view>
        <view class="summary-label">Updated titles</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{completedCount}}</view>
        <view class="summary-label">Completed</view>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Shelf programming</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{pinnedNovelId ? 'Pinned' : 'Open'}}</view>
        <view class="summary-label">Focus mode</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{activeFilterKey}}</view>
        <view class="summary-label">Reading lane</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{activeSortKey}}</view>
        <view class="summary-label">Ranking rule</view>
      </view>
    </view>
    <view class="subtitle">{{selectionReason || 'The shelf should explain why a title is being surfaced as the next reading session, not only expose controls.'}}</view>
  </view>

  <view class="card">
    <view class="section-label">Because you paused here</view>
    <view class="item-title">{{resumeCueTitle || 'Next reading return'}}</view>
    <view class="subtitle">{{resumeCueMeta || 'No active return point is surfaced yet.'}}</view>
    <view class="subtitle">{{resumeCueReason || 'The shelf should explain why one title is being surfaced as the fastest return path.'}}</view>
  </view>

  <view class="card">
    <view class="section-label">Active reading program</view>
    <view class="item">
      <view class="item-title">Current run</view>
      <view class="subtitle">{{activeLaneReason || 'Active titles should remain warm between sessions.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">{{backlogCueTitle || 'Backlog lane'}}</view>
      <view class="subtitle">{{backlogCueReason || 'Finished titles should become quiet re-entry candidates once the active run is complete.'}}</view>
      <view wx:if="{{backlogQueueLabel}}" class="subtitle">{{backlogQueueLabel}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Reading milestone</view>
    <view class="item-title">{{programMilestoneTitle || 'No archive milestone yet'}}</view>
    <view class="subtitle">{{programMilestoneCopy || 'Finished titles should eventually accumulate into stable milestones instead of disappearing behind active continuation cues.'}}</view>
    <view wx:if="{{programMilestoneMeta}}" class="subtitle">{{programMilestoneMeta}}</view>
  </view>

  <view wx:if="{{milestoneHistory.length > 0}}" class="card">
    <view class="section-label">Milestone history</view>
    <view wx:for="{{milestoneHistory}}" wx:key="title" class="item">
      <view class="item-badge item-badge-soft">{{item.typeLabel}}</view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.copy}}</view>
      <view class="subtitle">{{item.sourceLabel}}</view>
      <view wx:if="{{item.recencyLabel}}" class="subtitle">{{item.recencyLabel}}</view>
      <view wx:if="{{item.meta}}" class="subtitle">{{item.meta}}</view>
      <view class="subtitle">{{item.returnHint}}</view>
      <button wx:if="{{item.source !== 'bookshelf'}}" class="button button-inline" data-value="{{index}}" bindtap="onTapMilestoneHistoryItem">{{item.returnLabel}}</button>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Filter view</view>
    <view class="nav-row">
      <view class="nav-chip {{activeFilterKey === 'all' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapFilterAll">All</view>
      <view class="nav-chip {{activeFilterKey === 'updates' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapFilterUpdates">Updates</view>
      <view class="nav-chip {{activeFilterKey === 'completed' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapFilterCompleted">Completed</view>
    </view>
    <view class="section-label">Sort view</view>
    <view class="nav-row">
      <view class="nav-chip {{activeSortKey === 'recent' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapSortRecent">Recent</view>
      <view class="nav-chip {{activeSortKey === 'updated' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapSortUpdated">Updated</view>
      <view class="nav-chip {{activeSortKey === 'progress' ? 'nav-chip-active' : 'nav-chip-link'}}" bindtap="onTapSortProgress">Progress</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Selected focus</view>
    <view wx:if="{{pinnedItem}}" class="item">
      <view class="item-meta">
        <view class="item-badge">Pinned</view>
      </view>
      <view class="item-title">{{pinnedItem.title}}</view>
      <view class="subtitle">{{pinnedItem.continueChapterTitle || pinnedItem.latestChapterTitle || 'Saved continuation available'}} · because you pinned it above the rest of the shelf lane.</view>
      <view class="button-row">
        <button class="button button-inline" type="primary" data-value="{{pinnedItem.novelId}}" bindtap="onTapContinueNovel">Continue</button>
        <button class="button button-inline" bindtap="onTapClearPinned">Clear pin</button>
      </view>
    </view>
    <view wx:for="{{visibleItems}}" wx:key="novelId">
      <view wx:if="{{item.novelId === selectedNovelId}}" class="item">
        <view class="item-meta">
          <view wx:if="{{pinnedNovelId === item.novelId}}" class="item-badge">Pinned</view>
          <view wx:if="{{item.hasUpdate}}" class="item-badge">Updated</view>
          <view wx:if="{{item.progressPercent >= 0.99}}" class="item-badge item-badge-soft">Completed</view>
        </view>
        <view class="item-title">{{item.title}}</view>
        <view class="subtitle">{{item.continueChapterTitle || item.latestChapterTitle || 'Ready to reopen'}}</view>
        <view class="button-row">
          <button wx:if="{{pinnedNovelId !== item.novelId}}" class="button button-inline" data-value="{{item.novelId}}" bindtap="onTapPinNovel">Pin</button>
          <button wx:if="{{pinnedNovelId === item.novelId}}" class="button button-inline" bindtap="onTapClearPinned">Clear pin</button>
        </view>
        <button class="button" type="warn" data-value="{{item.novelId}}" bindtap="onTapRemoveNovel">Remove from shelf</button>
      </view>
    </view>
    <view wx:if="{{visibleItems.length === 0 && !loading}}" class="subtitle">{{errorText || emptyText}}</view>
    <button class="button" type="primary" bindtap="onTapContinueReading">Continue selected title</button>
    <button class="button" bindtap="onTapOpenSelected">Open selected detail</button>
  </view>

  <view class="card">
    <view class="section-label">Curator note</view>
    <view class="item">
      <view class="item-title">Why this title</view>
      <view class="subtitle">{{selectionReason || 'Choose a title to make the shelf read like an active workspace instead of a flat inventory.'}}</view>
    </view>
    <view class="item">
      <view class="item-title">Because you paused here</view>
      <view class="subtitle">{{resumeCueReason || (selectedNovelId ? 'Continue reading when a saved chapter exists. Otherwise, reopen detail to reset context before starting again.' : 'Pick a title, then either continue directly or inspect the detail dossier first.')}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Shelf inventory</view>
    <view wx:for="{{visibleItems}}" wx:key="novelId" class="item">
      <view class="item-meta">
        <view wx:if="{{pinnedNovelId === item.novelId}}" class="item-badge">Pinned</view>
        <view wx:if="{{item.hasUpdate}}" class="item-badge">Updated</view>
        <view wx:if="{{item.progressPercent >= 0.99}}" class="item-badge item-badge-soft">Completed</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.continueChapterTitle || item.latestChapterTitle || 'Continue reading'}} · {{item.updatedAt}}</view>
      <view class="button-row">
        <button class="button button-inline" data-value="{{item.novelId}}" bindtap="onTapSelectNovel">Focus</button>
        <button wx:if="{{pinnedNovelId !== item.novelId}}" class="button button-inline" data-value="{{item.novelId}}" bindtap="onTapPinNovel">Pin</button>
        <button wx:if="{{pinnedNovelId === item.novelId}}" class="button button-inline" bindtap="onTapClearPinned">Clear pin</button>
        <button class="button button-inline" type="primary" data-value="{{item.novelId}}" bindtap="onTapContinueNovel">Continue</button>
        <button class="button button-inline" data-value="{{item.novelId}}" bindtap="onTapOpenNovel">Detail</button>
        <button class="button button-inline" type="warn" data-value="{{item.novelId}}" bindtap="onTapRemoveNovel">Remove</button>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Active stack</view>
    <view class="subtitle">{{activeLaneReason || 'Titles still in motion should remain visible as the warm reading lane.'}}</view>
    <view wx:for="{{activeItems}}" wx:key="novelId" class="item">
      <view class="item-meta">
        <view wx:if="{{pinnedNovelId === item.novelId}}" class="item-badge">Pinned</view>
        <view class="item-badge item-badge-soft">Active</view>
      </view>
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle">{{item.continueChapterTitle || item.latestChapterTitle || 'Saved continuation available'}}{{pinnedNovelId === item.novelId ? ' · because you pinned it' : ''}}</view>
      <view class="subtitle">{{item.continueChapterTitle ? ('Because you paused at ' + item.continueChapterTitle + ', this title stays warm in the active stack.') : 'This title stays warm because it still has unfinished reading momentum.'}}</view>
      <view class="button-row">
        <button class="button button-inline" type="primary" data-value="{{item.novelId}}" bindtap="onTapContinueNovel">Continue</button>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Completed archive</view>
    <view class="subtitle">{{archiveReason || 'Finished titles are still part of the collection story and should remain easy to reopen.'}}</view>
    <view wx:for="{{completedItems}}" wx:key="novelId">
      <view class="item">
        <view class="item-meta">
          <view class="item-badge item-badge-soft">Completed</view>
        </view>
        <view class="item-title">{{item.title}}</view>
        <view class="subtitle">Completed run, still available for detail re-entry and archive browsing.</view>
        <view class="button-row">
          <button class="button button-inline" data-value="{{item.novelId}}" bindtap="onTapOpenNovel">Open detail</button>
        </view>
      </view>
    </view>
  </view>

  <view class="footer-nav card workspace-footer">
    <view class="footer-title">Shelf controls</view>
    <view class="footer-copy">This surface now exposes the same sorting and filtering logic as H5, even though Mini Program actions stay intentionally lighter.</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapCatalog">Home</view>
      <view class="nav-chip nav-chip-active">Bookshelf</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapSettings">Preferences</view>
    </view>
  </view>
</view>
`;
    case "novel-settings":
      return `<view class="page">
  <view class="header-menu card profile-menu">
    <view class="brand-block">
      <view class="brand-title">Reading Center</view>
      <view class="brand-subtitle">Calmer profile surface for display defaults, continuity, digest behavior, and session state</view>
    </view>
    <view class="menu-title">Profile Menu</view>
    <view class="nav-row">
      <view class="nav-chip nav-chip-link" bindtap="onTapOverview">Home</view>
      <view class="nav-chip nav-chip-link" bindtap="onTapPlan">Bookshelf</view>
      <view class="nav-chip nav-chip-active">Preferences</view>
    </view>
  </view>

  <view class="hero profile-hero">
    <view class="eyebrow">Reading center</view>
    <view class="title">{{title}}</view>
    <view class="subtitle">This surface now acts as the reading center for display defaults, continuity controls, digest posture, and account state.</view>
  </view>

  <view class="card">
    <view class="section-label">Reading center snapshot</view>
    <view class="summary-row">
      <view class="summary-stat">
        <view class="summary-value">{{sections.length}}</view>
        <view class="summary-label">Preference groups</view>
      </view>
      <view class="summary-stat">
        <view class="summary-value">{{sections[0].title || sections[0].key}}</view>
        <view class="summary-label">Primary section</view>
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Retention posture</view>
    <view class="item">
      <view class="item-title">Calmer defaults</view>
      <view class="subtitle">Reading Center should reduce friction between sessions, not add another administrative stop.</view>
    </view>
    <view class="item">
      <view class="item-title">Quiet signals</view>
      <view class="subtitle">Digest, reminders, and sync should behave like background support for long-form reading, not a notification engine.</view>
    </view>
    <view class="item">
      <view class="item-title">Return confidence</view>
      <view class="subtitle">This surface should keep home, shelf, and reader feeling like one stable reading system.</view>
    </view>
  </view>

  <view wx:for="{{sections}}" wx:for-item="section" wx:key="key" class="card">
    <view class="section-label">{{section.title || section.key}}</view>
    <view wx:for="{{section.items}}" wx:key="key" class="item">
      <view class="item-title">{{item.label}}</view>
      <view class="subtitle" wx:if="{{item.value}}">{{item.value}}</view>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Reader controls</view>
    <view class="subtitle">Update the same display preferences the reader hydrates, including the night-mode default used for late reading sessions.</view>
    <view class="button-row">
      <button class="button button-inline" bindtap="onTapDecreaseReaderFontScale">A-</button>
      <button class="button button-inline" bindtap="onTapIncreaseReaderFontScale">A+</button>
      <button class="button button-inline" bindtap="onTapCycleReaderTheme">Cycle theme</button>
      <button class="button button-inline" bindtap="onTapCycleReaderMode">Cycle mode</button>
      <button class="button button-inline" bindtap="onTapCycleNightModeDefault">Night default</button>
    </view>
    <button class="button" type="primary" bindtap="onTapApplyReader">Apply and Return</button>
    <button class="button" bindtap="onTapReader">Back to Reader</button>
  </view>

  <view class="card">
    <view class="section-label">Reading center controls</view>
    <view class="subtitle">Continuity, shelf order, reminders, digest behavior, and sync posture now live as stored reading-center preferences.</view>
    <view class="button-row">
      <button class="button button-inline" bindtap="onTapCycleResumeMode">Resume mode</button>
      <button class="button button-inline" bindtap="onTapCycleShelfOrder">Shelf order</button>
      <button class="button button-inline" bindtap="onTapCycleReminderMode">Reminders</button>
      <button class="button button-inline" bindtap="onTapCycleDigestMode">Digest</button>
      <button class="button button-inline" bindtap="onTapCycleSyncMode">Sync</button>
    </view>
  </view>

  <view class="card">
    <view class="section-label">Quick actions</view>
    <button class="button" bindtap="onTapOverview">Open Home</button>
    <button class="button" bindtap="onTapReader">Back to Reader</button>
    <button class="button" bindtap="onTapPlan">Open Bookshelf</button>
    <button class="button" type="warn" bindtap="onTapLogout">Sign Out</button>
  </view>
</view>
`;
    case "auth-basic":
      return `<view class="page">
  <view class="hero">
    <view class="eyebrow">Novel App</view>
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">Base authentication shell for the standalone novel app host.</view>
  </view>

  <view class="card">
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">{{authenticated ? 'Session restored. Continue into the app shell.' : 'Sign in flow is wired. Novel feature pages now live on dedicated routes.'}}</view>
    <view wx:if="{{errorMessage}}" class="subtitle">{{errorMessage}}</view>
    <view wx:if="{{noticeMessage}}" class="subtitle">{{noticeMessage}}</view>

    <button class="button" type="primary" loading="{{loading}}" bindtap="onTapLogin">
      Sign In
    </button>
    <button class="button" wx:if="{{!authenticated}}" bindtap="onTapEnsureLogin">
      Restore Session
    </button>
    <button class="button" wx:if="{{authenticated}}" bindtap="onTapOverview">
      Open Catalog
    </button>
    <button class="button" wx:if="{{authenticated}}" bindtap="onTapPlan">
      Open Bookshelf
    </button>
    <button class="button" wx:if="{{authenticated}}" bindtap="onTapSettings">
      Open Settings
    </button>
  </view>
</view>
`;
    case "list-basic":
      return `<view class="page">
  <view class="hero">
    <view class="eyebrow">Novel App</view>
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">Temporary list shell used while the novel-specific routes and features are being added.</view>
  </view>

  <view class="card">
    <view class="section-label">Page State</view>
    <view class="subtitle" wx:if="{{loading}}">Loading page data...</view>
    <view class="subtitle" wx:if="{{errorText}}">{{errorText}}</view>
    <view class="subtitle" wx:if="{{!loading && !errorText && items.length === 0}}">{{emptyText || 'No entries yet.'}}</view>

    <view wx:for="{{items}}" wx:key="id" class="item">
      <view class="item-title">{{item.title}}</view>
      <view class="subtitle" wx:if="{{item.subtitle}}">{{item.subtitle}}</view>
    </view>

    <button class="button" wx:if="{{hasMore}}" bindtap="onTapLoadMore">
      Load More
    </button>
  </view>

  <view class="card">
    <view class="section-label">Navigation</view>
    <button class="button" bindtap="onTapOverview">Open Catalog</button>
    <button class="button" bindtap="onTapPlan">Open Bookshelf</button>
    <button class="button" bindtap="onTapSettings">Open Settings</button>
  </view>
</view>
`;
    case "settings-basic":
      return `<view class="page">
  <view class="hero">
    <view class="eyebrow">Novel App</view>
    <view class="title">${entry.navigationBarTitleText}</view>
    <view class="subtitle">Temporary settings shell for the standalone novel app host.</view>
  </view>

  <view class="card">
    <view wx:for="{{sections}}" wx:for-item="section" wx:key="key">
      <view class="section-title" wx:if="{{section.title}}">{{section.title}}</view>
      <view wx:for="{{section.items}}" wx:key="key" class="item">
        <view class="item-title">{{item.label}}</view>
        <view class="subtitle" wx:if="{{item.value}}">{{item.value}}</view>
      </view>
    </view>
  </view>

  <view class="card">
    <button class="button" bindtap="onTapOverview">Open Catalog</button>
    <button class="button" bindtap="onTapPlan">Open Bookshelf</button>
    <button class="button" type="warn" bindtap="onTapLogout">Sign Out</button>
  </view>
</view>
`;
    default:
      throw new Error(`unknown WeChat shell template "${entry.shellTemplate}"`);
  }
}

function buildHostWechatIndexWxss(entry: HostWechatPageShellConfig): string {
  switch (entry.shellStyle) {
    case "login":
      return `.header-menu {
  margin-bottom: 24rpx;
}

.landing-menu {
  background: rgba(255, 253, 248, 0.96);
}

.hero {
  margin-bottom: 24rpx;
}

.landing-hero {
  padding: 8rpx 0 4rpx;
}

.landing-card {
  background: rgba(255, 255, 255, 0.96);
}

.landing-cta {
  background: linear-gradient(180deg, #fffaf1 0%, #ffffff 100%);
}

.landing-footer {
  background: rgba(255, 252, 246, 0.96);
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #123c69;
}

.status-text {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #5c677d;
}

.section-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #5c677d;
}

.summary-row {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.summary-stat {
  flex: 1;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.summary-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.summary-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #64748b;
}

.item-meta {
  margin-bottom: 12rpx;
}

.item-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fff2d7;
  color: #8a5a00;
  font-size: 20rpx;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}

.footer-nav {
  margin-top: 24rpx;
}
`;
    case "overview":
      return `.header-menu {
  margin-bottom: 24rpx;
}

.workspace-menu {
  background: rgba(248, 251, 255, 0.96);
}

.hero {
  margin-bottom: 24rpx;
}

.workspace-hero {
  padding: 8rpx 0 4rpx;
}

.workspace-summary,
.workspace-focus,
.workspace-footer {
  background: rgba(248, 251, 255, 0.98);
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #123c69;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.plan-chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #eef7f4;
  color: #2f5d50;
  font-size: 22rpx;
}

.section-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #5c677d;
}

.summary-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.summary-stat {
  flex: 1;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.summary-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.summary-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #64748b;
}

.item-meta {
  margin-bottom: 12rpx;
}

.item-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #e7f4ee;
  color: #2f5d50;
  font-size: 20rpx;
}

.item-badge-complete {
  background: #123c69;
  color: #ffffff;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}

.reason-text {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #475569;
}

.workspace-focus .item {
  padding: 20rpx 0;
}

.footer-nav {
  margin-top: 24rpx;
}
`;
    case "items":
      return `.header-menu {
  margin-bottom: 24rpx;
}

.execution-menu {
  background: rgba(247, 250, 255, 0.96);
}

.hero {
  margin-bottom: 24rpx;
}

.execution-hero {
  padding: 8rpx 0 4rpx;
}

.execution-summary,
.execution-complete,
.execution-queue,
.execution-controls,
.execution-footer {
  background: rgba(248, 251, 255, 0.98);
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #123c69;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.plan-chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #eef7f4;
  color: #2f5d50;
  font-size: 22rpx;
}

.section-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #5c677d;
}

.summary-row {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.summary-stat {
  flex: 1;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.summary-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.summary-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #64748b;
}

.item-meta {
  margin-bottom: 12rpx;
}

.item-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #9a6700;
  font-size: 20rpx;
}

.item-badge-complete {
  background: #123c69;
  color: #ffffff;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}

.completion-title {
  font-size: 32rpx;
}

.execution-queue .item {
  padding: 20rpx 0;
}

.footer-nav {
  margin-top: 24rpx;
}
`;
    case "settings":
      return `.header-menu {
  margin-bottom: 24rpx;
}

.profile-menu {
  background: rgba(252, 248, 242, 0.96);
}

.hero {
  margin-bottom: 24rpx;
}

.profile-hero {
  padding: 8rpx 0 4rpx;
}

.profile-card,
.profile-actions,
.profile-footer {
  background: rgba(255, 252, 248, 0.98);
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #7f5539;
}

.section-title {
  margin-top: 24rpx;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #7f5539;
}

.section-title:first-child {
  margin-top: 0;
}

.item-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #0f172a;
}

.profile-actions .section-title {
  color: #5c677d;
}

.footer-nav {
  margin-top: 24rpx;
}
`;
    case "generic":
      return `.hero {
  margin-bottom: 24rpx;
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #2563eb;
}

.status-chip {
  margin-top: 20rpx;
  display: inline-block;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 22rpx;
}
`;
    case "novel":
      return `.header-menu {
  margin-bottom: 24rpx;
}

.workspace-menu,
.profile-menu,
.workspace-footer {
  background: rgba(255, 253, 248, 0.96);
}

.workspace-hero,
.profile-hero {
  margin-bottom: 24rpx;
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #8a5d3b;
}

.brand-block {
  display: grid;
  gap: 8rpx;
}

.brand-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #14213d;
}

.brand-subtitle,
.menu-title,
.footer-copy,
.summary-label {
  font-size: 24rpx;
  line-height: 1.5;
  color: #64748b;
}

.menu-title,
.footer-title,
.section-label {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  color: #5c677d;
}

.nav-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.nav-chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #eef2f7;
  color: #475569;
  font-size: 24rpx;
}

.nav-chip-active {
  background: #14213d;
  color: #fffaf4;
}

.nav-chip-link {
  border: 1rpx solid #d7dee8;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}

.summary-stat {
  flex: 1;
  min-width: 180rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.summary-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #e2e8f0;
}

.item:last-child {
  border-bottom: 0;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.item-badge {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f0e7dc;
  color: #8a5d3b;
  font-size: 22rpx;
}

.item-badge-soft {
  background: #eef2f7;
  color: #475569;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #14213d;
}

.button {
  margin-top: 20rpx;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.button-inline {
  margin-top: 0;
}
`;
    default:
      throw new Error(`unknown WeChat shell style "${entry.shellStyle}"`);
  }
}

async function listExistingPageDirs(pagesRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(pagesRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function collectHostWechatShellViolations(
  repoRoot: string,
  hostAppName: string,
): Promise<string[]> {
  const hostSpec = await getHostAppSpec(repoRoot, hostAppName);
  const shells = await loadHostWechatPageShells(repoRoot, hostAppName);
  const pagesRoot = resolveHostFile(hostSpec, hostSpec.miniprogram.pages_dir ?? "miniprogram/pages");
  const appJsonPath = resolveHostFile(hostSpec, "miniprogram/app.json");
  const currentAppJson = JSON.parse(await readFile(appJsonPath, "utf8")) as Record<string, unknown>;
  const nextAppJson = {
    ...currentAppJson,
    pages: shells.map((entry) => entry.miniprogramPage),
  };
  const nextAppJsonText = `${JSON.stringify(nextAppJson, null, 2)}\n`;
  const currentAppJsonText = `${JSON.stringify(currentAppJson, null, 2)}\n`;
  const violations: string[] = [];

  if (currentAppJsonText !== nextAppJsonText) {
    violations.push(path.relative(repoRoot, appJsonPath));
  }

  for (const entry of shells) {
    const pageDir = path.join(pagesRoot, entry.pageKey);
    const indexTsPath = path.join(pageDir, "index.ts");
    const indexJsonPath = path.join(pageDir, "index.json");
    const indexWxmlPath = path.join(pageDir, "index.wxml");
    const indexWxssPath = path.join(pageDir, "index.wxss");
    const nextIndexTs = buildHostWechatIndexTs(entry);
    const nextIndexJson = buildHostWechatIndexJson(entry);
    const nextIndexWxml = buildHostWechatIndexWxml(entry);
    const nextIndexWxss = buildHostWechatIndexWxss(entry);

    let currentIndexTs = "";
    let currentIndexJson = "";
    let currentIndexWxml = "";
    let currentIndexWxss = "";

    try {
      currentIndexTs = await readFile(indexTsPath, "utf8");
    } catch {
      // ignore
    }

    try {
      currentIndexJson = await readFile(indexJsonPath, "utf8");
    } catch {
      // ignore
    }

    try {
      currentIndexWxml = await readFile(indexWxmlPath, "utf8");
    } catch {
      // ignore
    }

    try {
      currentIndexWxss = await readFile(indexWxssPath, "utf8");
    } catch {
      // ignore
    }

    if (currentIndexTs !== nextIndexTs) {
      violations.push(path.relative(repoRoot, indexTsPath));
    }

    if (currentIndexJson !== nextIndexJson) {
      violations.push(path.relative(repoRoot, indexJsonPath));
    }

    if (currentIndexWxml !== nextIndexWxml) {
      violations.push(path.relative(repoRoot, indexWxmlPath));
    }

    if (currentIndexWxss !== nextIndexWxss) {
      violations.push(path.relative(repoRoot, indexWxssPath));
    }
  }

  const expectedPageKeys = new Set(shells.map((entry) => entry.pageKey));
  for (const existingDir of await listExistingPageDirs(pagesRoot)) {
    if (!expectedPageKeys.has(existingDir)) {
      violations.push(path.relative(repoRoot, path.join(pagesRoot, existingDir)));
    }
  }

  return violations;
}

export async function checkHostWechatShellFiles(repoRoot: string): Promise<string[]> {
  const hostApps = await listHostApps(repoRoot);
  const violations: string[] = [];

  for (const hostApp of hostApps) {
    const hostSpec = await getHostAppSpec(repoRoot, hostApp.name);
    if (hostSpec.platform !== "wechat" || !hostSpec.registry.shell_module) {
      continue;
    }

    violations.push(...(await collectHostWechatShellViolations(repoRoot, hostApp.name)));
  }

  return violations;
}

export async function syncHostWechatShellFiles(repoRoot: string): Promise<void> {
  const hostApps = await listHostApps(repoRoot);

  for (const hostApp of hostApps) {
    const hostSpec = await getHostAppSpec(repoRoot, hostApp.name);
    if (hostSpec.platform !== "wechat" || !hostSpec.registry.shell_module) {
      continue;
    }

    const shells = await loadHostWechatPageShells(repoRoot, hostApp.name);
    const appJsonPath = resolveHostFile(hostSpec, "miniprogram/app.json");
    const currentAppJson = JSON.parse(await readFile(appJsonPath, "utf8")) as Record<string, unknown>;
    const nextAppJson = {
      ...currentAppJson,
      pages: shells.map((entry) => entry.miniprogramPage),
    };
    await writeFile(appJsonPath, `${JSON.stringify(nextAppJson, null, 2)}\n`, "utf8");

    for (const entry of shells) {
      const pageDir = path.join(resolveHostFile(hostSpec, hostSpec.miniprogram.pages_dir ?? "miniprogram/pages"), entry.pageKey);
      await mkdir(pageDir, { recursive: true });
      await writeFile(path.join(pageDir, "index.ts"), buildHostWechatIndexTs(entry), "utf8");
      await writeFile(path.join(pageDir, "index.json"), buildHostWechatIndexJson(entry), "utf8");
      await writeFile(path.join(pageDir, "index.wxml"), buildHostWechatIndexWxml(entry), "utf8");
      await writeFile(path.join(pageDir, "index.wxss"), buildHostWechatIndexWxss(entry), "utf8");
    }

    const expectedPageKeys = new Set(shells.map((entry) => entry.pageKey));
    const pagesRoot = resolveHostFile(hostSpec, hostSpec.miniprogram.pages_dir ?? "miniprogram/pages");
    for (const existingDir of await listExistingPageDirs(pagesRoot)) {
      if (!expectedPageKeys.has(existingDir)) {
        await rm(path.join(pagesRoot, existingDir), { recursive: true, force: true });
      }
    }
  }
}

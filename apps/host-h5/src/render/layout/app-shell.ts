import type { AppRouteId } from "@minix/contracts";
import { escapeHtml } from "@minix/core";

import type { HostH5Runtime } from "../../manifest/app.manifest";
import { HOST_H5_APP_STYLES } from "../theme/styles";
import { formatProgressTimestamp } from "../utils";

type HostH5PageKey = keyof HostH5Runtime["registry"];

interface HostH5NavigationItem {
  key: HostH5PageKey;
  routeId: AppRouteId;
  label: string;
}

const HOST_H5_NAVIGATION_ITEMS: HostH5NavigationItem[] = [
  { key: "login", routeId: "auth.login", label: "Home" },
  { key: "overview", routeId: "overview.index", label: "Overview" },
  { key: "items", routeId: "items.list", label: "Today's Plan" },
  { key: "feed", routeId: "feed.index", label: "Discover" },
  { key: "feedback", routeId: "feedback.form", label: "Feedback" },
  { key: "mediaTools", routeId: "media-tools.workspace", label: "Media Tools" },
  { key: "messages", routeId: "messages.index", label: "Inbox" },
  { key: "membership", routeId: "membership.center", label: "Commerce" },
  { key: "orders", routeId: "orders.center", label: "Orders" },
  { key: "settings", routeId: "settings.index", label: "Preferences" },
  { key: "account", routeId: "account.index", label: "Account" },
];

type ShellTone = "landing" | "dashboard" | "execution" | "profile" | "neutral";

export function buildGenericTitle(pageKey: string): string {
  return pageKey.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
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
    case "membership":
      return "Commerce Center";
    case "orders":
      return "Order Center";
    case "settings":
      return "Preferences";
    case "account":
      return "Account";
    default:
      return buildGenericTitle(pageKey);
  }
}

function renderGlobalNavigation(pageKey: HostH5PageKey, authenticated: boolean): string {
  return HOST_H5_NAVIGATION_ITEMS
    .filter((entry) => authenticated || entry.key === "login")
    .map(
      (entry) =>
        `<button class="me-nav-button ${entry.key === pageKey ? "me-nav-button-active" : ""}" data-route-id="${entry.routeId}">${entry.label}</button>`,
    )
    .join("");
}

function renderFooterLinks(pageKey: HostH5PageKey, authenticated: boolean): string {
  return [
    ...HOST_H5_NAVIGATION_ITEMS
      .filter((entry) => authenticated || entry.key === "login")
      .map(
        (entry) =>
          `<button class="me-footer-link ${entry.key === pageKey ? "me-footer-link-active" : ""}" data-route-id="${entry.routeId}">${entry.label}</button>`,
      ),
    `<span class="me-footer-link me-footer-link-muted">Progress</span>`,
    `<span class="me-footer-link me-footer-link-muted">Search</span>`,
  ].join("");
}

function resolveShellTone(pageKey: HostH5PageKey): ShellTone {
  switch (pageKey) {
    case "login":
      return "landing";
    case "overview":
    case "feed":
    case "feedback":
    case "mediaTools":
    case "messages":
    case "membership":
    case "orders":
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

export function renderApp(root: HTMLElement, title: string, runtime: HostH5Runtime, pageKey: HostH5PageKey, content: string) {
  document.title = title;
  const authenticated = isAuthenticated(runtime);
  const headerShell = buildHeaderShell(pageKey, runtime);
  const footerShell = buildFooterShell(pageKey, runtime);

  root.innerHTML = `
    <style>${HOST_H5_APP_STYLES}</style>
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

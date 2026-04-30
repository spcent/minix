import {
  activateShowablePageEntry,
  resolvePageKeyFromRouteMap,
  subscribeStoreBackedPages,
} from "@minix/core";

import type { HostH5Runtime } from "../manifest/app.manifest";
import { HOST_H5_ROUTES } from "../manifest/routes";
import { renderAccountPage } from "./pages/account";
import { renderIdentityWorkflowPage, renderLoginPage } from "./pages/auth";
import { renderMembershipPage, renderOrdersPage } from "./pages/commerce";
import { renderFeedPage } from "./pages/feed";
import { renderOverviewPage, renderItemsPage } from "./pages/learning";
import { createGenericRenderer } from "./pages/generic";
import { renderMessagesPage } from "./pages/messages";
import { renderFeedbackPage, renderMediaToolsPage } from "./pages/workspace";
import { renderSettingsPage } from "./pages/settings";
import type { HostH5PageEntry, HostH5PageKey, HostH5PageRenderContext, HostH5PageRenderer } from "./types";

export type { HostH5PageEntry, HostH5PageKey } from "./types";

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
  membership: {
    render(context) {
      renderMembershipPage(context);
    },
  },
  orders: {
    render(context) {
      renderOrdersPage(context);
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
  return resolvePageKeyFromRouteMap(pathname, HOST_H5_ROUTES, "login") as HostH5PageKey;
}

export async function activateHostH5Page(entry: HostH5PageEntry): Promise<void> {
  await activateShowablePageEntry(entry);
}

export function renderHostH5Page(context: HostH5PageRenderContext): void {
  const renderer = hostH5PageRenderers[context.pageKey] ?? createGenericRenderer(context.pageKey);
  renderer.render(context);
}

export function subscribeHostH5Pages(runtime: HostH5Runtime, sync: () => void): Array<() => void> {
  return subscribeStoreBackedPages(Object.values(runtime.pages), sync);
}

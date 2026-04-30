import { escapeHtml } from "@minix/core";
import type { SubscriptionState } from "@minix/feature-subscription";

import { renderButton } from "../components/buttons";
import { bindButton, bindRouteButtons } from "../dom-bindings";
import { renderApp } from "../layout/app-shell";
import type { HostH5PageRenderContext } from "../types";

export function renderMembershipPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.membership.store.getState() as SubscriptionState;
  const benefits = state.benefits.slice(0, 4);

  renderApp(
    root,
    "Commerce Center",
    runtime,
    "membership",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Commerce Center</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.overview?.subheadline ?? "Shared order, entitlement, reconciliation, and after-sales state now has an official host entry outside the novel-only membership flow.")}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.paymentResult?.status ?? "idle")}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(state.reconciliation?.status ?? "not reconciled")}</span>
              <span class="me-chip me-chip-warm">${escapeHtml(state.overview?.statusLabel ?? "Guest mode")}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Provider posture</p>
            <h2 class="me-panel-title">Backend payment mode stays explicit</h2>
            <ul class="me-panel-list">
              <li>Order state comes from the shared backend payment domain.</li>
              <li>Sample and production gateway behavior should remain visible in transaction copy.</li>
              <li>Host payment capability may be native, degraded, or unavailable by environment.</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card me-summary-card">
            <p class="me-section-kicker">Membership</p>
            <h2 class="me-card-title">${escapeHtml(state.overview?.headline ?? "Membership unlock")}</h2>
            <p class="me-card-subtitle">${escapeHtml(state.entitlementSummary ?? state.lockedMessage ?? "Choose a plan to unlock premium entitlements and persist order state through the shared commerce model.")}</p>
            <div class="me-inline-metrics">
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(String(state.orderList?.total ?? 0))}</p>
                <p class="me-inline-metric-label">Orders</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(String(state.subscriptions.length))}</p>
                <p class="me-inline-metric-label">Subscriptions</p>
              </div>
              <div class="me-inline-metric">
                <p class="me-inline-metric-value">${escapeHtml(String(state.afterSalesCases.length))}</p>
                <p class="me-inline-metric-label">After-sales cases</p>
              </div>
            </div>
            ${state.transactionMessage ? `<p class="me-detail-note">${escapeHtml(state.transactionMessage)}</p>` : ""}
            ${state.paymentExecutionDetail ? `<p class="me-detail-note">${escapeHtml(state.paymentExecutionDetail)}</p>` : ""}
            <div class="me-action-group">
              ${renderButton("membership-buy-monthly", "Purchase Monthly", "ghost")}
              ${renderButton("membership-buy-quarterly", "Purchase Quarterly", "primary")}
              ${renderButton("membership-buy-annual", "Purchase Annual", "ghost")}
              ${state.purchaseSuccessMessage ? renderButton("membership-continue", "Continue After Purchase", "secondary") : ""}
              ${renderButton("membership-open-orders", "Open Order Center", "secondary")}
              ${renderButton("membership-refresh", "Refresh Transaction", "ghost")}
              ${renderButton("membership-reconcile", "Reconcile Order", "ghost")}
              ${state.canCancelOrder ? renderButton("membership-cancel-order", "Cancel Order", "danger") : ""}
              ${state.canRefundOrder ? renderButton("membership-refund-order", "Refund Order", "danger") : ""}
              ${state.canCancelSubscription ? renderButton("membership-cancel-subscription", "Cancel Subscription", "ghost") : ""}
              ${state.canRenewSubscription ? renderButton("membership-renew-subscription", "Renew Subscription", "secondary") : ""}
              ${state.afterSalesCases.length > 0 ? renderButton("membership-after-sales", "Open After-Sales Detail", "ghost") : ""}
              ${renderButton("membership-back-discover", "Back to Discover", "secondary")}
            </div>
          </section>

          <section class="me-surface me-card me-summary-card">
            <p class="me-section-kicker">Commerce detail</p>
            <h2 class="me-card-title">Orders, entitlements, and benefits</h2>
            <ul class="me-detail-list">
              <li>${escapeHtml(`Selected order: ${state.order?.orderId ?? "None"}`)}</li>
              <li>${escapeHtml(`Payment result: ${state.paymentResult?.message ?? "No payment result loaded yet."}`)}</li>
              <li>${escapeHtml(`Reconciliation: ${state.reconciliation?.message ?? "Run reconciliation after callback confirmation when needed."}`)}</li>
              <li>${escapeHtml(`Return path: ${state.returnContextLabel ?? "Back to discover when no blocked source is attached."}`)}</li>
            </ul>
            ${benefits.length > 0
              ? `
                <div class="me-settings-group">
                  ${benefits
                    .map(
                      (benefit) => `
                        <section class="me-settings-section">
                          <h3 class="me-settings-title">${escapeHtml(benefit.label)}</h3>
                          <p class="me-settings-value">${escapeHtml(benefit.description)}</p>
                        </section>
                      `,
                    )
                    .join("")}
                </div>
              `
              : `<p class="me-empty">Benefits appear here after overview and entitlement data load.</p>`}
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  bindButton(root, "membership-buy-monthly", () => {
    void runtime.pages.membership.purchaseMembership("monthly").then(sync);
  });
  bindButton(root, "membership-buy-quarterly", () => {
    void runtime.pages.membership.purchaseMembership("quarterly").then(sync);
  });
  bindButton(root, "membership-buy-annual", () => {
    void runtime.pages.membership.purchaseMembership("annual").then(sync);
  });
  bindButton(root, "membership-continue", () => {
    void runtime.pages.membership.continueAfterPurchase().then(sync);
  });
  bindButton(root, "membership-open-orders", () => {
    void runtime.pages.membership.goToOrders().then(sync);
  });
  bindButton(root, "membership-refresh", () => {
    void runtime.pages.membership.refreshTransaction().then(sync);
  });
  bindButton(root, "membership-reconcile", () => {
    void runtime.pages.membership.reconcileOrder().then(sync);
  });
  bindButton(root, "membership-cancel-order", () => {
    void runtime.pages.membership.cancelOrder().then(sync);
  });
  bindButton(root, "membership-refund-order", () => {
    void runtime.pages.membership.refundOrder().then(sync);
  });
  bindButton(root, "membership-cancel-subscription", () => {
    void runtime.pages.membership.cancelSubscription().then(sync);
  });
  bindButton(root, "membership-renew-subscription", () => {
    void runtime.pages.membership.renewSubscription().then(sync);
  });
  bindButton(root, "membership-after-sales", () => {
    void runtime.pages.membership.loadAfterSalesDetail().then(sync);
  });
  bindButton(root, "membership-back-discover", () => {
    void runtime.pages.membership.goToCatalog().then(sync);
  });
}

export function renderOrdersPage({ root, runtime, sync }: HostH5PageRenderContext) {
  const state = runtime.pages.orders.store.getState() as SubscriptionState;
  const selectedOrder =
    state.order ?? state.orderList?.items.find((item) => item.orderId === state.selectedOrderId) ?? state.orderList?.items[0];
  const selectedAfterSalesCase =
    state.selectedAfterSalesCase ??
    (selectedOrder ? state.afterSalesCases.find((item) => item.orderId === selectedOrder.orderId) : undefined) ??
    state.afterSalesCases[0];

  renderApp(
    root,
    "Order Center",
    runtime,
    "orders",
    `
      <section class="me-screen">
        <section class="me-surface me-hero">
          <div class="me-hero-copy">
            <p class="me-eyebrow">Order Center</p>
            <h1 class="me-title">${escapeHtml(state.title)}</h1>
            <p class="me-subtitle">${escapeHtml(state.transactionMessage ?? "Routeable order history, detail recovery, and after-sales state now live outside the membership purchase entry.")}</p>
            <div class="me-chip-row">
              <span class="me-chip">${escapeHtml(state.orderListStatus.loadState)}</span>
              <span class="me-chip me-chip-accent">${escapeHtml(selectedOrder?.status ?? "No selected order")}</span>
              <span class="me-chip me-chip-warm">${escapeHtml(`${state.afterSalesCases.length} after-sales cases`)}</span>
            </div>
          </div>
          <aside class="me-panel">
            <p class="me-panel-kicker">Route decision</p>
            <h2 class="me-panel-title">Generic hosts get a dedicated order lane</h2>
            <ul class="me-panel-list">
              <li>Order list and detail stay on the shared subscription controller.</li>
              <li>Novel hosts remain on the membership-centered reading paywall flow.</li>
              <li>Gateway posture still comes from shared payment responses.</li>
            </ul>
          </aside>
        </section>

        <section class="me-grid me-grid-columns">
          <section class="me-surface me-card">
            <p class="me-section-kicker">Order history</p>
            <h2 class="me-card-title">Recent orders</h2>
            ${
              state.orderList?.items.length
                ? `
                  <div class="me-settings-group">
                    ${state.orderList.items
                      .slice(0, 6)
                      .map(
                        (item) => `
                          <section class="me-settings-section">
                            <h3 class="me-settings-title">${escapeHtml(item.title)}</h3>
                            <p class="me-settings-value">${escapeHtml(`${item.status} · ${item.productType} · ${item.currency} ${(item.totalAmountCents / 100).toFixed(2)}`)}</p>
                            <div class="me-action-group">
                              ${renderButton(`orders-open-${item.orderId}`, item.orderId === state.selectedOrderId ? "Selected" : "Open Order Detail", item.orderId === state.selectedOrderId ? "primary" : "secondary")}
                            </div>
                          </section>
                        `,
                      )
                      .join("")}
                  </div>
                `
                : `<p class="me-empty">${escapeHtml(state.errorText ?? "No orders are available yet.")}</p>`
            }
          </section>

          <section class="me-surface me-card me-summary-card">
            <p class="me-section-kicker">Selected detail</p>
            <h2 class="me-card-title">${escapeHtml(selectedOrder?.title ?? "Order detail")}</h2>
            <ul class="me-detail-list">
              <li>${escapeHtml(`Order id: ${selectedOrder?.orderId ?? "None selected"}`)}</li>
              <li>${escapeHtml(`Status: ${selectedOrder?.status ?? "No order status loaded yet."}`)}</li>
              <li>${escapeHtml(`Payment result: ${state.paymentResult?.message ?? "Open an order to hydrate payment detail."}`)}</li>
              <li>${escapeHtml(`Reconciliation: ${state.reconciliation?.message ?? "Reconciliation remains available when operators need it."}`)}</li>
              <li>${escapeHtml(`After-sales: ${selectedAfterSalesCase?.resultLabel ?? (selectedAfterSalesCase?.status ?? "No case selected.")}`)}</li>
            </ul>
            <div class="me-action-group">
              ${renderButton("orders-open-membership", "Open Commerce Center", "secondary")}
              ${renderButton("orders-refresh", "Refresh Order State", "ghost")}
              ${renderButton("orders-reconcile", "Reconcile Order", "ghost")}
              ${state.canCancelOrder ? renderButton("orders-cancel-order", "Cancel Order", "danger") : ""}
              ${state.canRefundOrder ? renderButton("orders-refund-order", "Refund Order", "danger") : ""}
              ${state.canCancelSubscription ? renderButton("orders-cancel-subscription", "Cancel Subscription", "ghost") : ""}
              ${state.canRenewSubscription ? renderButton("orders-renew-subscription", "Renew Subscription", "secondary") : ""}
              ${selectedAfterSalesCase ? renderButton(`orders-case-${selectedAfterSalesCase.caseId}`, "Open After-Sales Detail", "ghost") : ""}
              ${renderButton("orders-back-discover", "Back to Discover", "secondary")}
            </div>
          </section>
        </section>
      </section>
    `,
  );

  bindRouteButtons(root, runtime, sync);
  state.orderList?.items.slice(0, 6).forEach((item) => {
    bindButton(root, `orders-open-${item.orderId}`, () => {
      void runtime.pages.orders.loadOrderDetail(item.orderId).then(sync);
    });
  });
  state.afterSalesCases.forEach((item) => {
    bindButton(root, `orders-case-${item.caseId}`, () => {
      void runtime.pages.orders.loadAfterSalesDetail(item.caseId).then(sync);
    });
  });
  bindButton(root, "orders-open-membership", () => {
    void runtime.pages.orders.goToMembership().then(sync);
  });
  bindButton(root, "orders-refresh", () => {
    void runtime.pages.orders.refreshTransaction().then(sync);
  });
  bindButton(root, "orders-reconcile", () => {
    void runtime.pages.orders.reconcileOrder().then(sync);
  });
  bindButton(root, "orders-cancel-order", () => {
    void runtime.pages.orders.cancelOrder().then(sync);
  });
  bindButton(root, "orders-refund-order", () => {
    void runtime.pages.orders.refundOrder().then(sync);
  });
  bindButton(root, "orders-cancel-subscription", () => {
    void runtime.pages.orders.cancelSubscription().then(sync);
  });
  bindButton(root, "orders-renew-subscription", () => {
    void runtime.pages.orders.renewSubscription().then(sync);
  });
  bindButton(root, "orders-back-discover", () => {
    void runtime.pages.orders.goToCatalog().then(sync);
  });
}


import { registerPaymentAfterSalesRoutes } from "./routes.after-sales";
import { registerPaymentCallbackRoutes } from "./routes.callbacks";
import { registerPaymentCommerceRoutes } from "./routes.commerce";
import type { RegisterPaymentRoutesOptions } from "./route-options";

export type { RegisterPaymentRoutesOptions } from "./route-options";

export function registerPaymentRoutes(options: RegisterPaymentRoutesOptions) {
  const { app, requireSession } = options;

  app.use("/membership", requireSession);
  app.use("/membership/*", requireSession);
  app.use("/orders", requireSession);
  app.use("/orders/*", requireSession);
  app.use("/payments", requireSession);
  app.use("/payments/*", requireSession);
  app.use("/subscriptions", requireSession);
  app.use("/subscriptions/*", requireSession);
  app.use("/after-sales", requireSession);
  app.use("/after-sales/*", requireSession);

  registerPaymentCommerceRoutes(options);
  registerPaymentAfterSalesRoutes(options);
  registerPaymentCallbackRoutes(options);
}

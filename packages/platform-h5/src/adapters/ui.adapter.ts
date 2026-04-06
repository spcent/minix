import { createError, fail, ok, type UIAdapter } from "@minix/core";

const TOAST_ID = "minix-h5-toast";
const LOADING_ID = "minix-h5-loading";

export interface H5UiAdapterOptions {
  confirm?: (message: string) => boolean;
  document?: Document;
}

function ensureOverlay(documentApi: Document, elementId: string): HTMLElement | null {
  if (!documentApi.body) {
    return null;
  }

  const existing = documentApi.getElementById(elementId);
  if (existing) {
    return existing;
  }

  const next = documentApi.createElement("div");
  next.id = elementId;
  next.setAttribute("role", "status");
  next.style.position = "fixed";
  next.style.left = "50%";
  next.style.transform = "translateX(-50%)";
  next.style.zIndex = "9999";
  next.style.maxWidth = "calc(100vw - 32px)";
  next.style.padding = "10px 14px";
  next.style.borderRadius = "12px";
  next.style.background = "rgba(17, 24, 39, 0.9)";
  next.style.color = "#ffffff";
  next.style.fontSize = "14px";
  next.style.lineHeight = "1.4";
  next.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.2)";
  documentApi.body.appendChild(next);
  return next;
}

function removeOverlay(documentApi: Document | undefined, elementId: string) {
  documentApi?.getElementById(elementId)?.remove();
}

export function createH5UiAdapter(options: H5UiAdapterOptions = {}): UIAdapter {
  const documentApi = options.document ?? globalThis.document;
  const confirmFn = options.confirm ?? globalThis.confirm;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    async toast(toastOptions) {
      if (!documentApi) {
        return ok(undefined);
      }

      const toast = ensureOverlay(documentApi, TOAST_ID);
      if (!toast) {
        return ok(undefined);
      }

      toast.style.top = "20px";
      toast.textContent = toastOptions.title;

      if (toastTimer !== undefined) {
        clearTimeout(toastTimer);
      }

      toastTimer = setTimeout(() => {
        removeOverlay(documentApi, TOAST_ID);
        toastTimer = undefined;
      }, toastOptions.durationMs ?? 2000);
      return ok(undefined);
    },

    async loading(show, title) {
      if (!documentApi) {
        return ok(undefined);
      }

      if (show) {
        const loading = ensureOverlay(documentApi, LOADING_ID);
        if (!loading) {
          return ok(undefined);
        }

        loading.style.bottom = "24px";
        loading.textContent = title ?? "Loading";
        return ok(undefined);
      }

      removeOverlay(documentApi, LOADING_ID);
      return ok(undefined);
    },

    async modal(modalOptions) {
      if (!confirmFn) {
        return fail(createError("PLATFORM_UNSUPPORTED", "browser confirm API is unavailable", { recoverable: false }));
      }

      const message = modalOptions.title ? `${modalOptions.title}\n\n${modalOptions.content}` : modalOptions.content;
      return ok(confirmFn(message));
    },
  };
}

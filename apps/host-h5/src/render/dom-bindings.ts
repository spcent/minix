import type { HostH5Runtime } from "../manifest/app.manifest";

export function bindRouteButtons(root: HTMLElement, runtime: HostH5Runtime, sync: () => void) {
  root.querySelectorAll<HTMLElement>("[data-route-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const routeId = button.dataset.routeId;
      if (!routeId) {
        return;
      }

      void runtime.kernel.router.toRoute(routeId).then(sync);
    });
  });
}

export function bindButton(root: HTMLElement, id: string, handler: () => void) {
  root.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener("click", handler);
}

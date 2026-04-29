import type { HostH5Runtime } from "../../manifest/app.manifest";

export function ensureItemsProgress(runtime: HostH5Runtime, sync: () => void) {
  const targets = [runtime.pages.items, "overview" in runtime.pages ? runtime.pages.overview : null].filter(
    (target): target is HostH5Runtime["pages"]["items"] => target !== null,
  );

  for (const target of targets) {
    const state = target.store.getState();
    if (state.progressHydrated) {
      continue;
    }

    void target.hydrateProgress().then(sync);
  }
}

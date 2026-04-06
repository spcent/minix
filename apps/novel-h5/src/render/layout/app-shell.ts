import { renderSiteHeader } from "./site-header";
import type { NovelH5PageKey } from "../types";

export function renderAppShell(pageKey: NovelH5PageKey, body: string, options: { immersive?: boolean } = {}): string {
  const layoutClassName = options.immersive ? "nh-layout nh-layout-immersive" : "nh-layout";

  return `
    <main class="nh-shell">
      <div class="${layoutClassName}">
        ${options.immersive ? "" : renderSiteHeader(pageKey)}
        ${body}
        ${options.immersive ? "" : '<p class="nh-footer-note">Standalone novel runtime, rebuilt as a proper editorial site shell.</p>'}
      </div>
    </main>
  `;
}

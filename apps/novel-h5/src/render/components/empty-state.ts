import { renderActionRow, type RenderableAction } from "./action-row";
import { escapeHtml } from "../utils";

export function renderEmptyState(copy: string, actions: readonly RenderableAction[] = []): string {
  return `
    <div class="nh-empty-state">
      <p class="nh-copy">${escapeHtml(copy)}</p>
      ${renderActionRow(actions)}
    </div>
  `;
}

export type RenderableAction = string | false | null | undefined;

function isRenderableAction(action: RenderableAction): action is string {
  return typeof action === "string" && action.length > 0;
}

export function renderActionRow(actions: readonly RenderableAction[]): string {
  const visibleActions = actions.filter(isRenderableAction);
  if (visibleActions.length === 0) {
    return "";
  }

  return `<div class="nh-actions">${visibleActions.join("")}</div>`;
}

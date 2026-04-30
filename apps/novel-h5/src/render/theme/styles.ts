import { novelH5BaseStyles } from "./styles/base";
import { novelH5ComponentsStyles } from "./styles/components";
import { novelH5PagesStyles } from "./styles/pages";

const STYLE_ID = "novel-h5-shell-styles";

export const APP_STYLES = [
  novelH5BaseStyles,
  novelH5ComponentsStyles,
  novelH5PagesStyles,
].join("\n");

export function ensureNovelH5Styles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = APP_STYLES;
  document.head.appendChild(style);
}

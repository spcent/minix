import { hostH5BaseStyles } from "./styles/base";
import { hostH5ComponentsStyles } from "./styles/components";
import { hostH5PagesStyles } from "./styles/pages";

export const HOST_H5_APP_STYLES = [
  hostH5BaseStyles,
  hostH5ComponentsStyles,
  hostH5PagesStyles,
].join("\n");

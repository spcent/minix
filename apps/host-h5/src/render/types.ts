import type { HostH5Runtime } from "../manifest/app.manifest";

export type HostH5PageKey = keyof HostH5Runtime["registry"];
export type HostH5PageEntry = ReturnType<HostH5Runtime["registry"][HostH5PageKey]["createEntry"]>;

export interface HostH5PageRenderContext {
  root: HTMLElement;
  runtime: HostH5Runtime;
  pageKey: HostH5PageKey;
  entry: HostH5PageEntry;
  sync(): void;
}

export interface HostH5PageRenderer {
  render(context: HostH5PageRenderContext): void;
}

export interface PageWithReadyAction {
  markReady(): unknown;
}

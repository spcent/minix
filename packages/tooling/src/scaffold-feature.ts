import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ScaffoldFeatureOptions {
  featureName: string;
  template?: FeatureTemplate;
  repoRoot?: string;
}

export type FeatureTemplate = "generic" | "list" | "detail" | "form" | "profile";

interface FeatureNames {
  kebab: string;
  camel: string;
  pascal: string;
  packageName: string;
}

const FEATURE_TEMPLATES: readonly FeatureTemplate[] = ["generic", "list", "detail", "form", "profile"];

function toPascalCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join("");
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal[0]?.toLowerCase() + pascal.slice(1);
}

export function normalizeFeatureName(value: string): FeatureNames {
  const kebab = value.trim();
  if (!/^[a-z][a-z0-9-]*$/.test(kebab)) {
    throw new Error(`Invalid feature name "${value}". Use lowercase kebab-case such as "user-profile".`);
  }

  const pascal = toPascalCase(kebab);
  const camel = toCamelCase(kebab);

  return {
    kebab,
    camel,
    pascal,
    packageName: `@minix/feature-${kebab}`,
  };
}

export function normalizeFeatureTemplate(value: string | undefined): FeatureTemplate {
  const template = value?.trim() ?? "generic";
  if (FEATURE_TEMPLATES.includes(template as FeatureTemplate)) {
    return template as FeatureTemplate;
  }

  throw new Error(
    `Invalid feature template "${value}". Use one of: ${FEATURE_TEMPLATES.join(", ")}.`,
  );
}

function genericControllerSource(names: FeatureNames): string {
  return `import { createStore, type AppKernel } from "@minix/core";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "../model";

export interface Create${names.pascal}ControllerOptions {
  kernel: AppKernel;
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions) {
  const store = createStore<${names.pascal}State>({
    ...createDefault${names.pascal}State(),
    ...options.initialState,
  });

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },
  };
}
`;
}

function listControllerSource(names: FeatureNames): string {
  return `import type { AppRouteId } from "@minix/contracts";
import { createStore, type AppKernel } from "@minix/core";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "../model";

export interface Create${names.pascal}ControllerOptions {
  kernel: AppKernel;
  detailRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions) {
  const { kernel, detailRouteId, loginRouteId, settingsRouteId, initialState } = options;
  const store = createStore<${names.pascal}State>({
    ...createDefault${names.pascal}State(),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId, params?: Record<string, string | number | boolean>) {
    if (!routeId) {
      return undefined;
    }

    return kernel.router.toRoute(routeId, params);
  }

  return {
    store,

    loadInitial() {
      store.setState({
        ready: true,
        loading: false,
        refreshing: false,
        errorText: undefined,
      });
    },

    refresh() {
      store.setState({
        refreshing: true,
      });
      this.loadInitial();
    },

    selectItem(itemId: string) {
      store.setState({
        selectedItemId: itemId,
      });
    },

    openDetail(itemId?: string) {
      const nextItemId = itemId ?? store.getState().selectedItemId;
      return routeToOptional(detailRouteId, nextItemId ? { id: nextItemId } : undefined);
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
`;
}

function detailControllerSource(names: FeatureNames): string {
  return `import type { AppRouteId } from "@minix/contracts";
import { createStore, type AppKernel } from "@minix/core";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "../model";

export interface Create${names.pascal}ControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions) {
  const { kernel, loginRouteId, settingsRouteId, initialState } = options;
  const store = createStore<${names.pascal}State>({
    ...createDefault${names.pascal}State(),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return undefined;
    }

    return kernel.router.toRoute(routeId);
  }

  return {
    store,

    loadInitial() {
      store.setState({
        ready: true,
        loading: false,
        errorCode: undefined,
        errorText: undefined,
      });
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
`;
}

function formControllerSource(names: FeatureNames): string {
  return `import type { AppRouteId } from "@minix/contracts";
import { createStore, type AppKernel } from "@minix/core";
import { createDefault${names.pascal}State, type ${names.pascal}State, type ${names.pascal}Values } from "../model";

export interface Create${names.pascal}ControllerOptions {
  kernel: AppKernel;
  successRouteId?: AppRouteId;
  cancelRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions) {
  const { kernel, successRouteId, cancelRouteId, initialState } = options;
  const store = createStore<${names.pascal}State>({
    ...createDefault${names.pascal}State(),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return undefined;
    }

    return kernel.router.toRoute(routeId);
  }

  return {
    store,

    markReady() {
      store.setState({ ready: true });
    },

    updateValues(values: Partial<${names.pascal}Values>) {
      store.setState({
        dirty: true,
        values: {
          ...store.getState().values,
          ...values,
        },
      });
    },

    async submit() {
      store.setState({
        ready: true,
        submitting: false,
        errorCode: undefined,
        errorText: undefined,
      });

      return routeToOptional(successRouteId);
    },

    cancel() {
      return routeToOptional(cancelRouteId);
    },
  };
}
`;
}

function profileControllerSource(names: FeatureNames): string {
  return `import type { AppRouteId } from "@minix/contracts";
import { createStore, type AppKernel } from "@minix/core";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "../model";

export interface Create${names.pascal}ControllerOptions {
  kernel: AppKernel;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export function create${names.pascal}Controller(options: Create${names.pascal}ControllerOptions) {
  const { kernel, loginRouteId, settingsRouteId, initialState } = options;
  const store = createStore<${names.pascal}State>({
    ...createDefault${names.pascal}State(),
    ...initialState,
  });

  async function routeToOptional(routeId?: AppRouteId) {
    if (!routeId) {
      return undefined;
    }

    return kernel.router.toRoute(routeId);
  }

  return {
    store,

    loadInitial() {
      store.setState({
        ready: true,
        loading: false,
        errorCode: undefined,
        errorText: undefined,
      });
    },

    selectAction(actionKey: string) {
      store.setState({
        selectedActionKey: actionKey,
      });
    },

    goToLogin() {
      return routeToOptional(loginRouteId);
    },

    goToSettings() {
      return routeToOptional(settingsRouteId);
    },
  };
}
`;
}

function controllerSource(names: FeatureNames, template: FeatureTemplate): string {
  switch (template) {
    case "list":
      return listControllerSource(names);
    case "detail":
      return detailControllerSource(names);
    case "form":
      return formControllerSource(names);
    case "profile":
      return profileControllerSource(names);
    default:
      return genericControllerSource(names);
  }
}

function genericFeatureManifestSource(names: FeatureNames): string {
  return `import type { CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {
  surface: "${names.kebab}",
};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      kernel,
      initialState: {
        ...createDefault${names.pascal}State(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
    h5: {
      entryActions: {
        onShow: "markReady",
        onTapReady: "markReady",
      },
    },
  },
});

export { createDefault${names.pascal}State };
`;
}

function listFeatureManifestSource(names: FeatureNames): string {
  return `import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  detailRouteId?: AppRouteId;
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {
  surface: "${names.kebab}",
  template: "list",
};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      kernel,
      detailRouteId: options.detailRouteId,
      loginRouteId: options.loginRouteId,
      settingsRouteId: options.settingsRouteId,
      initialState: {
        ...createDefault${names.pascal}State(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
        onPullDownRefresh: "refresh",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
  },
});

export { createDefault${names.pascal}State };
`;
}

function detailFeatureManifestSource(names: FeatureNames): string {
  return `import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {
  surface: "${names.kebab}",
  template: "detail",
};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      kernel,
      loginRouteId: options.loginRouteId,
      settingsRouteId: options.settingsRouteId,
      initialState: {
        ...createDefault${names.pascal}State(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
  },
});

export { createDefault${names.pascal}State };
`;
}

function formFeatureManifestSource(names: FeatureNames): string {
  return `import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  successRouteId?: AppRouteId;
  cancelRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {
  surface: "${names.kebab}",
  template: "form",
};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      kernel,
      successRouteId: options.successRouteId,
      cancelRouteId: options.cancelRouteId,
      initialState: {
        ...createDefault${names.pascal}State(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "markReady",
      },
    },
    h5: {
      entryActions: {
        onShow: "markReady",
      },
    },
  },
});

export { createDefault${names.pascal}State };
`;
}

function profileFeatureManifestSource(names: FeatureNames): string {
  return `import type { AppRouteId, CapabilityRequirement, GuardPolicy } from "@minix/contracts";
import { defineFeatureManifest, type AppKernel, type FeatureConfig } from "@minix/core";

import { create${names.pascal}Controller } from "./controller";
import { createDefault${names.pascal}State, type ${names.pascal}State } from "./model";

export interface ${names.pascal}FeatureControllerOptions {
  loginRouteId?: AppRouteId;
  settingsRouteId?: AppRouteId;
  initialState?: Partial<${names.pascal}State>;
}

export const ${names.camel}CapabilityRequirements: CapabilityRequirement[] = [];
export const ${names.camel}GuardPolicy: GuardPolicy | undefined = undefined;
export const ${names.camel}FeatureConfig: FeatureConfig = {
  surface: "${names.kebab}",
  template: "profile",
};

export const ${names.camel}FeatureManifest = defineFeatureManifest<
  ${names.pascal}FeatureControllerOptions,
  ${names.pascal}State,
  ReturnType<typeof create${names.pascal}Controller>
>()({
  featureKey: "${names.kebab}",
  pageKey: "${names.camel}",
  packageName: "${names.packageName}",
  exportName: "${names.camel}FeatureManifest",
  createController(
    _host,
    kernel: AppKernel,
    options: ${names.pascal}FeatureControllerOptions,
    pageData: ${names.pascal}State,
  ) {
    return create${names.pascal}Controller({
      kernel,
      loginRouteId: options.loginRouteId,
      settingsRouteId: options.settingsRouteId,
      initialState: {
        ...createDefault${names.pascal}State(),
        ...pageData,
        ...options.initialState,
      },
    });
  },
  hosts: {
    wechat: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
    h5: {
      entryActions: {
        onShow: "loadInitial",
      },
    },
  },
});

export { createDefault${names.pascal}State };
`;
}

function featureManifestSource(names: FeatureNames, template: FeatureTemplate): string {
  switch (template) {
    case "list":
      return listFeatureManifestSource(names);
    case "detail":
      return detailFeatureManifestSource(names);
    case "form":
      return formFeatureManifestSource(names);
    case "profile":
      return profileFeatureManifestSource(names);
    default:
      return genericFeatureManifestSource(names);
  }
}

function genericControllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import type { AppKernel } from "@minix/core";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} controller marks state ready", () => {
  const controller = create${names.pascal}Controller({
    kernel: {} as AppKernel,
  });

  assert.equal(controller.store.getState().ready, false);
  controller.markReady();
  assert.equal(controller.store.getState().ready, true);
});
`;
}

function listControllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import type { AppKernel } from "@minix/core";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} list controller loads and selects items", () => {
  const controller = create${names.pascal}Controller({
    kernel: {} as AppKernel,
  });

  controller.loadInitial();
  controller.selectItem("item-1");

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().selectedItemId, "item-1");
});
`;
}

function detailControllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import type { AppKernel } from "@minix/core";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} detail controller marks the page ready", () => {
  const controller = create${names.pascal}Controller({
    kernel: {} as AppKernel,
  });

  controller.loadInitial();

  assert.equal(controller.store.getState().ready, true);
});
`;
}

function formControllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import type { AppKernel } from "@minix/core";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} form controller updates values and marks the form dirty", () => {
  const controller = create${names.pascal}Controller({
    kernel: {} as AppKernel,
  });

  controller.updateValues({
    name: "Casey",
  });

  assert.equal(controller.store.getState().dirty, true);
  assert.equal(controller.store.getState().values.name, "Casey");
});
`;
}

function profileControllerTestSource(names: FeatureNames): string {
  return `import test from "node:test";
import assert from "node:assert/strict";

import type { AppKernel } from "@minix/core";

import { create${names.pascal}Controller } from "./index";

test("${names.kebab} profile controller loads and tracks the selected action", () => {
  const controller = create${names.pascal}Controller({
    kernel: {} as AppKernel,
  });

  controller.loadInitial();
  controller.selectAction("open-settings");

  assert.equal(controller.store.getState().ready, true);
  assert.equal(controller.store.getState().selectedActionKey, "open-settings");
});
`;
}

function controllerTestSource(names: FeatureNames, template: FeatureTemplate): string {
  switch (template) {
    case "list":
      return listControllerTestSource(names);
    case "detail":
      return detailControllerTestSource(names);
    case "form":
      return formControllerTestSource(names);
    case "profile":
      return profileControllerTestSource(names);
    default:
      return genericControllerTestSource(names);
  }
}

function featureManifestTestSource(names: FeatureNames, template: FeatureTemplate): string {
  const expectation =
    template === "list" || template === "detail" || template === "profile"
      ? 'controller.loadInitial();\n\n  assert.equal(controller.store.getState().ready, true);'
      : 'assert.equal(controller.store.getState().ready, false);';
  return `import assert from "node:assert/strict";
import test from "node:test";

import type { AppKernel } from "@minix/core";

import { ${names.camel}FeatureManifest } from "./feature.manifest";
import { createDefault${names.pascal}State } from "./model";

test("${names.kebab} feature manifest creates a controller from host page data", () => {
  const controller = ${names.camel}FeatureManifest.createController(
    "h5",
    {} as AppKernel,
    {},
    createDefault${names.pascal}State(),
  );

  ${expectation}
});
`;
}

function genericModelSource(names: FeatureNames): string {
  return `export interface ${names.pascal}State {
  title: string;
  subtitle: string;
  ready: boolean;
}

export interface Create${names.pascal}StateOptions {
  title: string;
  subtitle: string;
}

export interface CreateDefault${names.pascal}StateOptions {
  title?: string;
  subtitle?: string;
}

export function create${names.pascal}State(options: Create${names.pascal}StateOptions): ${names.pascal}State {
  return {
    title: options.title,
    subtitle: options.subtitle,
    ready: false,
  };
}

export function createDefault${names.pascal}State(
  options: CreateDefault${names.pascal}StateOptions = {},
): ${names.pascal}State {
  return create${names.pascal}State({
    title: options.title ?? "${names.pascal}",
    subtitle: options.subtitle ?? "${names.kebab} workspace state",
  });
}
`;
}

function listModelSource(names: FeatureNames): string {
  return `import { createDefaultListPageState, type ListPageState } from "@minix/core";

export interface ${names.pascal}Item {
  id: string;
  title: string;
  subtitle?: string;
}

export type ${names.pascal}State = ListPageState<${names.pascal}Item>;

export interface CreateDefault${names.pascal}StateOptions {
  title?: string;
  subtitle?: string;
  pageSize?: number;
  emptyText?: string;
  items?: ${names.pascal}Item[];
}

export function createDefault${names.pascal}State(
  options: CreateDefault${names.pascal}StateOptions = {},
): ${names.pascal}State {
  return createDefaultListPageState<${names.pascal}Item>({
    title: options.title ?? "${names.pascal}",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    pageSize: options.pageSize ?? 20,
    emptyText: options.emptyText ?? "No ${names.kebab} items are available yet.",
    ...(options.items ? { items: options.items } : {}),
  });
}
`;
}

function detailModelSource(names: FeatureNames): string {
  return `import { createDefaultDetailPageState, type DetailPageState } from "@minix/core";

export interface ${names.pascal}Detail {
  id: string;
  title: string;
  description?: string;
}

export type ${names.pascal}State = DetailPageState<${names.pascal}Detail>;

export interface CreateDefault${names.pascal}StateOptions {
  title?: string;
  subtitle?: string;
  data?: ${names.pascal}Detail;
}

export function createDefault${names.pascal}State(
  options: CreateDefault${names.pascal}StateOptions = {},
): ${names.pascal}State {
  return createDefaultDetailPageState<${names.pascal}Detail>({
    title: options.title ?? "${names.pascal}",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    ...(options.data !== undefined ? { data: options.data } : {}),
  });
}
`;
}

function formModelSource(names: FeatureNames): string {
  return `import { createDefaultFormPageState, type FormPageState } from "@minix/core";

export interface ${names.pascal}Values {
  name: string;
  notes: string;
}

export type ${names.pascal}State = FormPageState<${names.pascal}Values>;

export interface CreateDefault${names.pascal}StateOptions {
  title?: string;
  subtitle?: string;
  values?: Partial<${names.pascal}Values>;
}

export function createDefault${names.pascal}State(
  options: CreateDefault${names.pascal}StateOptions = {},
): ${names.pascal}State {
  return createDefaultFormPageState<${names.pascal}Values>({
    title: options.title ?? "${names.pascal}",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
    values: {
      name: "",
      notes: "",
      ...options.values,
    },
  });
}
`;
}

function profileModelSource(names: FeatureNames): string {
  return `import { createDefaultProfilePageState, type ProfilePageState } from "@minix/core";

export type ${names.pascal}State = ProfilePageState;

export interface CreateDefault${names.pascal}StateOptions {
  title?: string;
  subtitle?: string;
}

export function createDefault${names.pascal}State(
  options: CreateDefault${names.pascal}StateOptions = {},
): ${names.pascal}State {
  return createDefaultProfilePageState({
    title: options.title ?? "${names.pascal}",
    ...(options.subtitle !== undefined ? { subtitle: options.subtitle } : {}),
  });
}
`;
}

function modelSource(names: FeatureNames, template: FeatureTemplate): string {
  switch (template) {
    case "list":
      return listModelSource(names);
    case "detail":
      return detailModelSource(names);
    case "form":
      return formModelSource(names);
    case "profile":
      return profileModelSource(names);
    default:
      return genericModelSource(names);
  }
}

function indexSource(): string {
  return `export * from "./controller/index";
export * from "./feature.manifest";
export * from "./model/index";
`;
}

function packageJsonSource(names: FeatureNames): string {
  return `${JSON.stringify(
    {
      name: names.packageName,
      version: "0.1.0",
      private: true,
      main: "src/index.ts",
      types: "src/index.ts",
      dependencies: {
        "@minix/contracts": "workspace:*",
        "@minix/core": "workspace:*",
      },
    },
    null,
    2,
  )}
`;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function updateTsconfigPaths(repoRoot: string, names: FeatureNames) {
  const tsconfigPath = path.join(repoRoot, "tsconfig.base.json");
  const raw = await readFile(tsconfigPath, "utf8");
  const parsed = JSON.parse(raw) as {
    compilerOptions?: {
      paths?: Record<string, string[]>;
    };
  };

  const currentPaths = parsed.compilerOptions?.paths ?? {};
  const featureEntries = Object.entries(currentPaths).filter(([key]) => key.startsWith("@minix/feature-"));
  const otherEntries = Object.entries(currentPaths).filter(([key]) => !key.startsWith("@minix/feature-"));
  const nextFeatureEntries = new Map(featureEntries);
  nextFeatureEntries.set(names.packageName, [`packages/features/${names.kebab}/src`]);

  const sortedFeatureEntries = Array.from(nextFeatureEntries.entries()).sort(([left], [right]) => left.localeCompare(right));
  const nextPaths = Object.fromEntries([...otherEntries, ...sortedFeatureEntries]);

  const nextConfig = {
    ...parsed,
    compilerOptions: {
      ...parsed.compilerOptions,
      paths: nextPaths,
    },
  };

  await writeFile(tsconfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
}

export async function scaffoldFeature(options: ScaffoldFeatureOptions) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const names = normalizeFeatureName(options.featureName);
  const template = normalizeFeatureTemplate(options.template);
  const featureDir = path.join(repoRoot, "packages", "features", names.kebab);

  if (await exists(featureDir)) {
    throw new Error(`Feature package already exists: ${path.relative(repoRoot, featureDir)}`);
  }

  await mkdir(path.join(featureDir, "src", "controller"), { recursive: true });
  await mkdir(path.join(featureDir, "src", "model"), { recursive: true });

  await writeFile(path.join(featureDir, "package.json"), packageJsonSource(names), "utf8");
  await writeFile(path.join(featureDir, "src", "index.ts"), indexSource(), "utf8");
  await writeFile(path.join(featureDir, "src", "controller", "index.ts"), controllerSource(names, template), "utf8");
  await writeFile(path.join(featureDir, "src", "controller", "index.test.ts"), controllerTestSource(names, template), "utf8");
  await writeFile(path.join(featureDir, "src", "feature.manifest.ts"), featureManifestSource(names, template), "utf8");
  await writeFile(path.join(featureDir, "src", "feature.manifest.test.ts"), featureManifestTestSource(names, template), "utf8");
  await writeFile(path.join(featureDir, "src", "model", "index.ts"), modelSource(names, template), "utf8");

  await updateTsconfigPaths(repoRoot, names);

  return {
    featureDir,
    packageName: names.packageName,
  };
}

function usage(): string {
  return "Usage: pnpm scaffold:feature <feature-name> [generic|list|detail|form|profile]";
}

async function main() {
  const featureName = process.argv[2];
  const template = process.argv[3];
  if (!featureName || featureName === "--help" || featureName === "-h") {
    console.log(usage());
    return;
  }

  const result = await scaffoldFeature({
    featureName,
    ...(template ? { template: normalizeFeatureTemplate(template) } : {}),
  });
  console.log(`scaffolded ${result.packageName}`);
  console.log(path.relative(process.cwd(), result.featureDir));
}

const isEntrypoint = process.argv[1] ? /scaffold-feature\.(ts|js)$/.test(path.basename(process.argv[1])) : false;
if (isEntrypoint) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

import type { ConfigValue } from "@minix/contracts";

import type { Result } from "../error/index";
import type { FeatureConfig } from "../types/index";

export interface ConfigAdapter {
  get<TValue extends ConfigValue = ConfigValue>(key: string): Result<TValue | null>;
  getFeatureConfig(featureKey: string): Result<FeatureConfig | null>;
}

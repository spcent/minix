import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_LIFECYCLE_EVENTS,
  CAPABILITY_KINDS,
  GUARD_EFFECTS,
  PAGE_LIFECYCLE_EVENTS,
  PROVIDER_POSTURE_MODES,
  TELEMETRY_LEVELS,
} from "../index";

test("kernel contract exports expose stable enumeration values", () => {
  assert.deepEqual(CAPABILITY_KINDS, [
    "clipboard",
    "device",
    "location",
    "payment",
    "share",
    "subscription",
    "upload",
  ]);
  assert.deepEqual(PROVIDER_POSTURE_MODES, ["sample", "production"]);
  assert.deepEqual(APP_LIFECYCLE_EVENTS, ["bootstrap", "ready", "foreground", "background", "teardown"]);
  assert.deepEqual(PAGE_LIFECYCLE_EVENTS, ["load", "show", "hide", "unload", "pullDownRefresh", "reachBottom"]);
  assert.deepEqual(TELEMETRY_LEVELS, ["debug", "info", "warn", "error"]);
  assert.deepEqual(GUARD_EFFECTS, ["allow", "redirect", "deny"]);
});

import assert from "node:assert/strict";
import test from "node:test";

import { renderActionButton } from "../utils";
import { renderActionRow } from "./action-row";
import { renderEmptyState } from "./empty-state";
import { renderInfoPanel } from "./info-panel";

test("renderActionRow filters empty actions and preserves button markup", () => {
  const button = renderActionButton("Retry", "controller", "retry", "asset-1", "primary");

  assert.equal(renderActionRow([]), "");
  assert.equal(renderActionRow([undefined, false, button]), `<div class="nh-actions">${button}</div>`);
});

test("renderInfoPanel and renderEmptyState escape text content", () => {
  const panel = renderInfoPanel({
    label: "Provider <state>",
    title: "Ready & safe",
    copy: "\"quoted\"",
  });
  const empty = renderEmptyState("No <items>");

  assert.match(panel, /Provider &lt;state&gt;/);
  assert.match(panel, /Ready &amp; safe/);
  assert.match(panel, /&quot;quoted&quot;/);
  assert.match(empty, /No &lt;items&gt;/);
});

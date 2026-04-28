import test from "node:test";
import assert from "node:assert/strict";

import { formatCompactDisplayNumber, formatDisplayDate } from "./display-format";

test("formatDisplayDate formats valid short dates", () => {
  assert.equal(formatDisplayDate("2026-04-28T12:00:00.000Z"), "Apr 28");
});

test("formatDisplayDate returns fallback for missing or invalid values", () => {
  assert.equal(formatDisplayDate(undefined), "Recently");
  assert.equal(formatDisplayDate("not-a-date"), "Recently");
  assert.equal(formatDisplayDate("not-a-date", { fallback: "Unknown" }), "Unknown");
});

test("formatCompactDisplayNumber formats valid compact values", () => {
  assert.equal(formatCompactDisplayNumber(1250), "1.3K");
});

test("formatCompactDisplayNumber returns fallback for invalid values", () => {
  assert.equal(formatCompactDisplayNumber(undefined), "0");
  assert.equal(formatCompactDisplayNumber(Number.NaN), "0");
  assert.equal(formatCompactDisplayNumber(Number.POSITIVE_INFINITY, { fallback: "--" }), "--");
});

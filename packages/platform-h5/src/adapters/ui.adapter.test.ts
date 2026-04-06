import assert from "node:assert/strict";
import test from "node:test";

import { createH5UiAdapter } from "./ui.adapter";

interface StubElement {
  id: string;
  textContent: string | null;
  style: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  remove: () => void;
}

function createStubDocument() {
  const elements = new Map<string, StubElement>();

  const document = {
    body: {
      appendChild(element: StubElement) {
        elements.set(element.id, element);
      },
    },
    createElement() {
      const element: StubElement = {
        id: "",
        textContent: null,
        style: {},
        setAttribute() {},
        remove() {
          elements.delete(element.id);
        },
      };

      return element;
    },
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  return {
    document: document as unknown as Document,
    elements,
  };
}

test("h5 ui adapter surfaces toast and loading feedback through the document", async () => {
  const runtime = createStubDocument();
  const adapter = createH5UiAdapter({
    document: runtime.document,
  });

  await adapter.toast({ title: "Saved", durationMs: 50 });
  await adapter.loading(true, "Syncing");

  assert.equal(runtime.elements.get("minix-h5-toast")?.textContent, "Saved");
  assert.equal(runtime.elements.get("minix-h5-loading")?.textContent, "Syncing");

  await adapter.loading(false);

  assert.equal(runtime.elements.has("minix-h5-loading"), false);
});

test("h5 ui adapter uses browser confirm semantics for modal prompts", async () => {
  const adapter = createH5UiAdapter({
    confirm(message) {
      assert.equal(message, "Sign out\n\nDo you want to leave this session?");
      return false;
    },
  });

  const result = await adapter.modal({
    title: "Sign out",
    content: "Do you want to leave this session?",
  });

  assert.deepEqual(result, { ok: true, value: false });
});

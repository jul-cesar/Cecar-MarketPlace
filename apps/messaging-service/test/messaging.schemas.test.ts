import test from "node:test";
import assert from "node:assert/strict";

import {
  listQuerySchema,
  sendMessageSchema,
} from "../src/schemas/messaging.schemas";

test("listQuerySchema applies default limit", () => {
  const parsed = listQuerySchema.parse({});
  assert.equal(parsed.limit, 50);
});

test("sendMessageSchema trims and validates body", () => {
  const parsed = sendMessageSchema.parse({ body: "  hola  " });
  assert.equal(parsed.body, "hola");
  assert.throws(() => sendMessageSchema.parse({ body: "   " }));
});

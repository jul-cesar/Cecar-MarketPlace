import test from "node:test";
import assert from "node:assert/strict";

import { buildUploadLogPayload } from "../src/lib/upload-log.js";

test("buildUploadLogPayload returns serializable upload info", () => {
  assert.deepEqual(
    buildUploadLogPayload({
      key: "file-key",
      name: "photo.png",
      size: 1024,
      url: "https://cdn.example.com/photo.png",
    }),
    {
      key: "file-key",
      name: "photo.png",
      size: 1024,
      url: "https://cdn.example.com/photo.png",
    }
  );
});

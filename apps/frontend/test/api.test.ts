import test from "node:test"
import assert from "node:assert/strict"

import { gatewayUrl, normalizeGatewayBaseUrl } from "../src/lib/api.js"

test("normalizeGatewayBaseUrl removes duplicated api prefix", () => {
  assert.equal(
    normalizeGatewayBaseUrl("https://cecarhub.com/api/v1"),
    "https://cecarhub.com"
  )
})

test("gatewayUrl appends leading slash when missing", () => {
  assert.equal(gatewayUrl("api/v1/admin/users"), "http://localhost:8080/api/v1/admin/users")
})

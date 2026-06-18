import test from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_EMAIL_DOMAIN, isInstitutionalEmail } from "../src/lib/email-policy.ts";

test("accepts institutional email", () => {
  assert.equal(isInstitutionalEmail(`user${ALLOWED_EMAIL_DOMAIN}`), true);
});

test("rejects non institutional email", () => {
  assert.equal(isInstitutionalEmail("user@gmail.com"), false);
  assert.equal(isInstitutionalEmail(undefined), false);
});

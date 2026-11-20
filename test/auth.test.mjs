import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.mjs";
import { safeNext } from "../src/lib/auth/redirect.mjs";

test("a hashed password verifies, and a wrong one doesn't", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.match(hash, /^scrypt\$32768\$8\$1\$/);
  assert.equal(await verifyPassword("correct horse battery", hash), true);
  assert.equal(await verifyPassword("correct horse batterY", hash), false);
});

test("the same password hashes differently each time", async () => {
  assert.notEqual(await hashPassword("same password"), await hashPassword("same password"));
});

test("malformed hashes are rejected rather than throwing", async () => {
  for (const stored of ["", "plain", "scrypt$1$2$3", "bcrypt$a$b$c$d$e", "scrypt$0$8$1$AAAA$AAAA"]) {
    assert.equal(await verifyPassword("anything", stored), false, stored);
  }
});

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/trips/a/b/edit"), "/trips/a/b/edit");
  assert.equal(safeNext("/states/kerala?x=1#top"), "/states/kerala?x=1#top");
});

test("safeNext refuses anything that could leave the site", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "evil",
    "/\u0000//evil.example",
    null,
    undefined,
    ["/a"],
  ]) {
    assert.equal(safeNext(value), "/", String(value));
  }
});

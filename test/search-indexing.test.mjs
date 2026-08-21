import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const studioHtml = await readFile(
  new URL("../studio/index.html", import.meta.url),
  "utf8"
);

const headers = await readFile(
  new URL("../_headers", import.meta.url),
  "utf8"
);

test("studio redirect is excluded from search indexing", () => {
  assert.match(
    studioHtml,
    /<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">/
  );
  assert.match(
    studioHtml,
    /<meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex">/
  );
  assert.match(headers, /^\/studio\/\*$/m);
  assert.match(
    headers,
    /^\s+X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex$/m
  );
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const privacyHtml = await readFile(
  new URL("../studio/privacy.html", import.meta.url),
  "utf8"
);

const deletionHtml = await readFile(
  new URL("../studio/data-deletion.html", import.meta.url),
  "utf8"
);

test("studio Meta policy pages stay publicly readable but excluded from search", () => {
  for (const html of [privacyHtml, deletionHtml]) {
    assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">/);
    assert.doesNotMatch(html, /http-equiv="refresh"/);
  }
});

test("studio privacy notice describes Threads connection data", () => {
  assert.match(privacyHtml, /Threads 사용자 ID/);
  assert.match(privacyHtml, /OAuth 액세스 토큰/);
  assert.match(privacyHtml, /게시물 즉시 발행 또는 예약 발행/);
  assert.match(privacyHtml, /data-deletion\.html/);
});

test("studio deletion notice provides both self-service and contact paths", () => {
  assert.match(deletionHtml, /SNS 계정 연결/);
  assert.match(deletionHtml, /연결 해제/);
  assert.match(deletionHtml, /mailto:partner@moding\.app/);
  assert.match(deletionHtml, /비밀번호, 인증번호, 액세스 토큰 또는 앱 시크릿 코드/);
});

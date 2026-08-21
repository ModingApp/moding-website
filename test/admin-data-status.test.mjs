import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const adminHtml = await readFile(
  new URL("../admin.html", import.meta.url),
  "utf8"
);

function extractFunction(name, nextName) {
  const start = adminHtml.indexOf(`function ${name}`);
  const end = adminHtml.indexOf(`function ${nextName}`, start);
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return adminHtml.slice(start, end);
}

test("admin unwraps sync_meta API wrappers", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("parseSyncMeta", "googleSyncIssueText")}; this.parseSyncMeta = parseSyncMeta;`,
    context
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.parseSyncMeta({
      value: JSON.stringify({
        at: "2026-08-22T00:10:00.000Z",
        latestCsvDate: "2026-08-13"
      }),
      updatedAt: "2026-08-22 00:10:01"
    }))),
    {
      at: "2026-08-22T00:10:00.000Z",
      latestCsvDate: "2026-08-13",
      updatedAt: "2026-08-22 00:10:01"
    }
  );

  assert.equal(
    context.parseSyncMeta({
      value: "",
      updatedAt: "2026-08-22 00:10:01"
    }),
    null
  );
});

test("admin explains visitors from before attribution tracking", () => {
  assert.match(adminHtml, /분류 적용 전/);
  assert.match(adminHtml, /beforeTrackingVisitors/);
  assert.match(adminHtml, /stats-v16-data-freshness/);
  assert.match(adminHtml, /androidFreshnessAffectsPeriod/);
  assert.match(adminHtml, /Google 보고서 지연 확인 필요/);
});

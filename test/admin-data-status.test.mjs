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

test("admin keeps visitors without detailed attribution in the main totals", () => {
  const context = {
    number(value) {
      return Number(value || 0);
    },
    getUniquePeriod() {
      return { visitors: 0 };
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("attributionCoverage", "attributionStartText")}; this.attributionCoverage = attributionCoverage;`,
    context
  );

  const coverage = context.attributionCoverage(
    {
      confirmed: { visitors: 32 },
      estimated: { visitors: 0 },
      unresolved: { visitors: 23 }
    },
    { visitors: 410 }
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(coverage)),
    {
      periodVisitors: 410,
      classifiedVisitors: 55,
      withoutDetailVisitors: 355
    }
  );
  assert.match(adminHtml, /전체 방문과 채널 집계에 모두 포함됩니다/);
  assert.match(adminHtml, /세부 판정 정보 없음/);
  assert.doesNotMatch(adminHtml, /분류 시작 전/);
  assert.match(adminHtml, /withoutDetailVisitors/);
  assert.match(adminHtml, /stats-v16-data-freshness/);
  assert.match(adminHtml, /androidFreshnessAffectsPeriod/);
  assert.match(adminHtml, /Google 보고서 지연 확인 필요/);
});

test("channel ranking uses complete date-filtered channel records", () => {
  const context = {
    number(value) {
      return Number(value || 0);
    },
    channelFamily(source) {
      return source;
    },
    channelEntry(row) {
      return Number(row?.visits || row?.downloads || 0);
    },
    channelUniqueEntry(row) {
      return Number(row?.uniqueEntrants || 0);
    },
    getChannelPeriod() {
      return {
        sources: [
          {
            source: "daangn",
            visits: 247,
            downloads: 45,
            uniqueEntrants: 36,
            uniqueDownloads: 9
          },
          {
            source: "google",
            visits: 40,
            downloads: 4,
            uniqueEntrants: 40,
            uniqueDownloads: 4
          }
        ]
      };
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("groupChannels", "getPlatformClicks")}; this.groupChannels = groupChannels;`,
    context
  );

  const channels = JSON.parse(JSON.stringify(context.groupChannels()));

  assert.equal(channels.external[0].source, "daangn");
  assert.equal(channels.external[0].entry, 247);
  assert.equal(channels.externalEntries, 287);
  assert.equal(channels.externalUniqueEntries, 76);
  assert.match(adminHtml, /const totalForVisual = channels\.externalEntries/);
  assert.match(
    adminHtml,
    /channelBarsHtml\(channels\.external, channels\.externalEntries, "entry", "회"\)/
  );
  assert.doesNotMatch(adminHtml, /channelUsesPeople/);
});

test("recent seven-day channel view requests and renders the selected range", () => {
  assert.match(
    adminHtml,
    /if \(period === "last7"\) \{\s*return \{ startDate: addIsoDays\(today, -6\), endDate: today \};/
  );
  assert.match(
    adminHtml,
    /statsPath\.searchParams\.set\("from", range\.startDate\);/
  );
  assert.match(
    adminHtml,
    /statsPath\.searchParams\.set\("to", range\.endDate\);/
  );
  assert.match(
    adminHtml,
    /state\.stats\?\.selectedRange\?\.channels/
  );

  const context = {
    state: {
      period: "last7",
      stats: {
        channels: {
          total: {
            visits: 999,
            sources: [{ source: "daangn", visits: 999 }]
          }
        },
        selectedRange: {
          channels: {
            visits: 7,
            sources: [{ source: "daangn", visits: 7 }]
          }
        }
      }
    },
    isRangePeriod() {
      return true;
    },
    number(value) {
      return Number(value || 0);
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("getChannelPeriod", "getAttributionPeriod")}; this.getChannelPeriod = getChannelPeriod;`,
    context
  );

  const selected = JSON.parse(JSON.stringify(context.getChannelPeriod()));
  assert.equal(selected.visits, 7);
  assert.equal(selected.sources[0].visits, 7);
});

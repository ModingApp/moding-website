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

test("channel reporting uses people only for fully covered periods", () => {
  const context = {
    state: {
      period: "today",
      stats: {
        uniqueTracking: { trackingStartDate: "2026-08-21" }
      }
    },
    currentDate() {
      return "2026-08-23";
    },
    selectedPeriodRange(period) {
      if (period === "last7") {
        return { startDate: "2026-08-17", endDate: "2026-08-23" };
      }
      if (period === "last30") {
        return { startDate: "2026-07-25", endDate: "2026-08-23" };
      }
      return null;
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("selectedPeriodBounds", "isRangePeriod")}; this.hasCompleteUniqueTracking = hasCompleteUniqueTracking;`,
    context
  );

  assert.equal(context.hasCompleteUniqueTracking(), true);
  context.state.period = "last7";
  assert.equal(context.hasCompleteUniqueTracking(), false);
  context.state.period = "last30";
  assert.equal(context.hasCompleteUniqueTracking(), false);
  context.state.period = "all";
  assert.equal(context.hasCompleteUniqueTracking(), false);
});

test("channel ranking switches between people and event counts", () => {
  const context = {
    usePeople: false,
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
    channelReportingUsesPeople() {
      return context.usePeople;
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

  const eventChannels = JSON.parse(JSON.stringify(context.groupChannels()));

  assert.equal(eventChannels.usePeople, false);
  assert.equal(eventChannels.external[0].source, "daangn");
  assert.equal(eventChannels.external[0].entry, 247);
  assert.equal(eventChannels.externalEntries, 287);
  assert.equal(eventChannels.externalUniqueEntries, 76);

  context.usePeople = true;
  const peopleChannels = JSON.parse(JSON.stringify(context.groupChannels()));

  assert.equal(peopleChannels.usePeople, true);
  assert.equal(peopleChannels.external[0].source, "google");
  assert.equal(peopleChannels.external[0].uniqueEntry, 40);
  assert.match(adminHtml, /const totalForVisual = usePeople/);
  assert.match(
    adminHtml,
    /usePeople \? "uniqueEntry" : "entry"/
  );
  assert.match(adminHtml, /스토어로 간 사람/);
  assert.match(adminHtml, /고유 추적 이전 기록 포함/);
});

test("today channel card separates unique people from repeated events", () => {
  const context = {
    number(value) {
      return Number(value || 0);
    },
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    percent(value, total) {
      return total > 0 ? value / total * 100 : 0;
    },
    formatRate(value) {
      return `${Number(value).toFixed(1)}%`;
    },
    formatNumber(value) {
      return Number(value || 0).toLocaleString("ko-KR");
    },
    escapeHtml(value) {
      return String(value);
    },
    channelMeta() {
      return { label: "당근", color: "#ff6f0f" };
    },
    channelIconHtml() {
      return "🥕";
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractFunction("channelBarsHtml", "platformBarsHtml")}; this.channelBarsHtml = channelBarsHtml;`,
    context
  );

  const row = {
    source: "daangn",
    entry: 80,
    downloads: 76,
    ios: 13,
    android: 63,
    unknown: 0,
    uniqueEntry: 70,
    uniqueEntrants: 70,
    uniqueDownloads: 69,
    uniqueIos: 13,
    uniqueAndroid: 56,
    uniqueUnknown: 0
  };

  const peopleHtml = context.channelBarsHtml([row], 70, "uniqueEntry", "명");
  assert.match(peopleHtml, /이동률 98\.6%/);
  assert.match(peopleHtml, /70명/);
  assert.match(peopleHtml, /69명/);
  assert.match(peopleHtml, /방문 80회 · 스토어 이동 76회/);

  const eventHtml = context.channelBarsHtml([row], 80, "entry", "회");
  assert.match(eventHtml, /이동률 95\.0%/);
  assert.match(eventHtml, /고유 ID 확인 유입 70명 · 스토어 이동 69명/);
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

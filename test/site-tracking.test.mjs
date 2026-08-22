import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const trackingCode =
  fs.readFileSync(
    new URL(
      "../assets/js/site-tracking.js",
      import.meta.url
    ),
    "utf8"
  );

const indexCode =
  fs.readFileSync(
    new URL(
      "../index.html",
      import.meta.url
    ),
    "utf8"
  );

const adminCode =
  fs.readFileSync(
    new URL(
      "../admin.html",
      import.meta.url
    ),
    "utf8"
  );

class MemoryStorage {
  constructor(initial = {}) {
    this.values =
      new Map(
        Object.entries(initial)
      );
  }

  getItem(key) {
    return this.values.has(key)
      ? this.values.get(key)
      : null;
  }

  setItem(key, value) {
    this.values.set(
      key,
      String(value)
    );
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function runTracking({
  search = "",
  referrer = "",
  userAgent = "Mozilla/5.0",
  savedAttribution = null,
  sessionAttribution = null,
} = {}) {
  const requests = [];
  const localStorage =
    new MemoryStorage({
      moding_visitor_id_v1:
        "mv_1234567890abcdef",
    });

  if (savedAttribution) {
    localStorage.setItem(
      "moding_tracking_attribution_v1",
      JSON.stringify(
        savedAttribution
      )
    );
  }

  const sessionStorage =
    new MemoryStorage();

  if (sessionAttribution) {
    sessionStorage.setItem(
      "moding_tracking_session_attribution_v1",
      JSON.stringify(
        sessionAttribution
      )
    );
  }

  const window = {
    location: {
      search,
      pathname: "/",
    },
  };

  const context = {
    window,
    document: {
      referrer,
    },
    navigator: {
      userAgent,
    },
    localStorage,
    sessionStorage,
    fetch: (url, options) => {
      requests.push({
        url,
        options,
      });
      return Promise.resolve({
        ok: true,
      });
    },
    URL,
    URLSearchParams,
    crypto: {
      randomUUID: () =>
        "00000000-0000-4000-8000-000000000000",
    },
    console,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(
    trackingCode,
    context
  );

  return {
    attribution:
      window.ModingTracking,
    body:
      requests.length > 0
        ? JSON.parse(
            requests[0].options.body
          )
        : null,
  };
}

test("채널 태그를 확정 출처로 전송한다", () => {
  const result = runTracking({
    search:
      "?src=threads&cid=threads_profile",
  });

  assert.equal(
    result.attribution.source,
    "threads"
  );
  assert.equal(
    result.attribution.sourceMethod,
    "tagged"
  );
  assert.equal(
    result.attribution.confidence,
    "confirmed"
  );
  assert.equal(
    result.body.campaignId,
    "threads_profile"
  );
});

test("네이버 검색 리퍼러를 확정 출처로 전송한다", () => {
  const result = runTracking({
    referrer:
      "https://search.naver.com/search.naver?query=moding",
  });

  assert.equal(
    result.attribution.source,
    "naver_search"
  );
  assert.equal(
    result.attribution.sourceMethod,
    "referrer"
  );
  assert.equal(
    result.body.referrerHost,
    "search.naver.com"
  );
});

test("인앱 브라우저 정보는 추정 출처로 전송한다", () => {
  const result = runTracking({
    userAgent:
      "Mozilla/5.0 Instagram 350.0",
  });

  assert.equal(
    result.attribution.source,
    "instagram"
  );
  assert.equal(
    result.attribution.sourceMethod,
    "in_app"
  );
  assert.equal(
    result.attribution.confidence,
    "estimated"
  );
});

test("30일 이내 저장된 유입은 추정 출처로 이어간다", () => {
  const result = runTracking({
    savedAttribution: {
      source: "kakao",
      campaignId: "message_01",
      referrerHost: "",
      capturedAt: Date.now() -
        24 * 60 * 60 * 1000,
    },
  });

  assert.equal(
    result.attribution.source,
    "kakao"
  );
  assert.equal(
    result.attribution.sourceMethod,
    "persisted"
  );
});

test("근거가 없으면 미확인 직접 유입으로 전송한다", () => {
  const result = runTracking();

  assert.equal(
    result.attribution.source,
    "direct"
  );
  assert.equal(
    result.attribution.confidence,
    "unresolved"
  );
});

test("내부 페이지 이동 뒤에도 최초 세션의 확정 근거를 유지한다", () => {
  const result = runTracking({
    referrer:
      "https://moding.app/",
    sessionAttribution: {
      source: "threads",
      sourceMethod: "tagged",
      campaignId: "threads_profile",
      referrerHost: "",
      landingPage: "/",
    },
  });

  assert.equal(
    result.attribution.source,
    "threads"
  );
  assert.equal(
    result.attribution.sourceMethod,
    "tagged"
  );
  assert.equal(
    result.attribution.confidence,
    "confirmed"
  );
  assert.equal(
    result.body.landingPage,
    "/"
  );
});

test("홈페이지 스토어 이동은 출처 근거를 함께 보내고 내부 링크에 출처 태그를 재생성하지 않는다", () => {
  assert.match(
    indexCode,
    /sourceMethod:\s*MODING_TRACKING_CONTEXT\.sourceMethod/
  );
  assert.match(
    indexCode,
    /landingPage:\s*MODING_TRACKING_CONTEXT\.landingPage/
  );
  assert.doesNotMatch(
    indexCode,
    /\/download\.html\?src=/
  );
});

test("관리자 출처 진단은 보조 정보로 한 번만 표시한다", () => {
  const unresolvedAssignments =
    adminCode.match(
      /const unresolvedAttribution = attributionDisplay\(attribution\.unresolved\);/g
    ) || [];

  assert.equal(
    unresolvedAssignments.length,
    1
  );
  assert.match(
    adminCode,
    /REQUIRED_WORKER_VERSION = "stats-v16-data-freshness"/
  );
  assert.doesNotMatch(
    adminCode,
    /const unresolvedValue = channels\.direct/
  );
});

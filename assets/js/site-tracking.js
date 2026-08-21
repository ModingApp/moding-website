(() => {
  "use strict";

  const API_BASE = "https://flat-queen-f1fb.moding-inc.workers.dev";
  const SOURCE_KEY = "moding_tracking_source";
  const SESSION_ATTRIBUTION_KEY = "moding_tracking_session_attribution_v1";
  const ATTRIBUTION_KEY = "moding_tracking_attribution_v1";
  const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const VISITOR_KEY = "moding_visitor_id_v1";
  const VISITOR_SESSION_KEY = "moding_visitor_id_session_v1";
  const VISIT_PREFIX = "moding_site_visit_tracked_v1";

  const aliases = {
    none: "direct",
    organic_direct: "direct",
    karrot: "daangn",
    danggeun: "daangn",
    daangn_market: "daangn",
    karrotmarket: "daangn",
    naverblog: "naver_blog",
    blog_naver: "naver_blog",
    navercafe: "naver_cafe",
    cafe_naver: "naver_cafe",
    naverplace: "naver_place",
    smartplace: "naver_place",
    naver_smartplace: "naver_place",
    naversearch: "naver_search",
    "naver-search": "naver_search",
    naverorganic: "naver_search",
    naver_organic: "naver_search",
    kakaotalk: "kakao",
    kakao_talk: "kakao",
    insta: "instagram",
    thread: "threads",
    threads_app: "threads",
    fb: "facebook",
    twitter: "x",
    yt: "youtube",
    flyer: "leaflet",
    offline_flyer: "leaflet",
    pamphlet: "leaflet",
    qrcode: "qr",
    googleplay: "google_play",
    playstore: "google_play",
    appstore: "app_store",
    apple: "app_store"
  };

  function storageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch (error) {}
  }

  function normalizeSource(value) {
    const source = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 50);

    return aliases[source] || source;
  }

  function normalizeCampaign(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 100);
  }

  function normalizeAttributionMethod(value, source) {
    const method = String(value || "")
      .trim()
      .toLowerCase();

    if (source === "direct") return "direct";
    if (["tagged", "referrer", "in_app", "persisted"].includes(method)) return method;
    return "persisted";
  }

  function normalizeReferrerHost(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "")
      .slice(0, 120);
  }

  function normalizeLandingPage(value) {
    let page = String(value || window.location.pathname || "/")
      .split("?")[0]
      .split("#")[0];

    if (!page.startsWith("/")) page = `/${page}`;
    return page.slice(0, 300);
  }

  function normalizeSessionAttribution(value) {
    const source = normalizeSource(value?.source);
    if (!source) return null;

    const sourceMethod = normalizeAttributionMethod(value?.sourceMethod, source);
    const referrerHost = normalizeReferrerHost(value?.referrerHost);

    return {
      source,
      sourceMethod: sourceMethod === "referrer" && !referrerHost
        ? "persisted"
        : sourceMethod,
      campaignId: normalizeCampaign(value?.campaignId),
      referrerHost,
      landingPage: normalizeLandingPage(value?.landingPage)
    };
  }

  function readSessionAttribution() {
    const raw = storageGet(sessionStorage, SESSION_ATTRIBUTION_KEY);
    if (!raw) return null;

    try {
      return normalizeSessionAttribution(JSON.parse(raw));
    } catch (error) {
      storageRemove(sessionStorage, SESSION_ATTRIBUTION_KEY);
      return null;
    }
  }

  function rememberSessionAttribution(value) {
    const attribution = normalizeSessionAttribution(value);
    if (!attribution) return null;

    storageSet(sessionStorage, SOURCE_KEY, attribution.source);
    storageSet(sessionStorage, SESSION_ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  }

  function isNaverSearchReferrer(referrer, host) {
    if (host === "search.naver.com" || host.endsWith(".search.naver.com")) {
      return true;
    }

    const isNaverHost = host === "naver.com" || host.endsWith(".naver.com");
    if (!isNaverHost) return false;

    const path = String(referrer.pathname || "").toLowerCase();
    return path.includes("/search.naver") ||
      path.startsWith("/search/") ||
      referrer.searchParams.has("query") ||
      referrer.searchParams.has("where");
  }

  function referrerAttribution() {
    if (!document.referrer) return null;

    try {
      const referrer = new URL(document.referrer);
      const host = referrer.hostname.toLowerCase().replace(/^www\./, "");
      if (!host || host === "moding.app" || host.endsWith(".moding.app")) return null;

      const querySource = normalizeSource(
        referrer.searchParams.get("source") ||
        referrer.searchParams.get("src") ||
        referrer.searchParams.get("utm_source")
      );

      if (querySource) return { source: querySource, referrerHost: host };
      if (/daangn\.com|karrotmarket\.com|karrot\.com/.test(host)) return { source: "daangn", referrerHost: host };
      if (host === "blog.naver.com" || host.endsWith(".blog.naver.com")) return { source: "naver_blog", referrerHost: host };
      if (host === "cafe.naver.com" || host.endsWith(".cafe.naver.com")) return { source: "naver_cafe", referrerHost: host };
      if (host === "m.place.naver.com" || host === "place.naver.com" || host.endsWith(".place.naver.com")) return { source: "naver_place", referrerHost: host };
      if (isNaverSearchReferrer(referrer, host)) return { source: "naver_search", referrerHost: host };
      if (host === "naver.me" || host === "naver.com" || host.endsWith(".naver.com")) return { source: "naver", referrerHost: host };
      if (host === "kakao.com" || host.endsWith(".kakao.com") || host.endsWith(".kakaocorp.com")) return { source: "kakao", referrerHost: host };
      if (host === "google.com" || host.endsWith(".google.com") || /^google\.[a-z.]+$/.test(host)) return { source: "google", referrerHost: host };
      if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return { source: "youtube", referrerHost: host };
      if (host === "instagram.com" || host.endsWith(".instagram.com")) return { source: "instagram", referrerHost: host };
      if (host === "threads.net" || host.endsWith(".threads.net") || host === "threads.com" || host.endsWith(".threads.com")) return { source: "threads", referrerHost: host };
      if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com") return { source: "facebook", referrerHost: host };
      if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host === "t.co") return { source: "x", referrerHost: host };
      return { source: "referral", referrerHost: host };
    } catch (error) {
      return null;
    }
  }

  function sourceFromInAppBrowser() {
    const ua = String(navigator.userAgent || "");
    if (/KAKAOTALK/i.test(ua)) return "kakao";
    if (/NAVER/i.test(ua)) return "naver";
    if (/Instagram/i.test(ua)) return "instagram";
    if (/Threads|Barcelona/i.test(ua)) return "threads";
    if (/FBAN|FBAV|FBIOS|FB_IAB/i.test(ua)) return "facebook";
    if (/Twitter/i.test(ua)) return "x";
    if (/YouTube/i.test(ua)) return "youtube";
    return "";
  }

  function readStoredAttribution() {
    const raw = storageGet(localStorage, ATTRIBUTION_KEY);
    if (!raw) return null;

    try {
      const saved = JSON.parse(raw);
      const capturedAt = Number(saved?.capturedAt || 0);
      const source = normalizeSource(saved?.source);
      if (!source || source === "direct" || !capturedAt || Date.now() - capturedAt > ATTRIBUTION_TTL_MS) {
        storageRemove(localStorage, ATTRIBUTION_KEY);
        return null;
      }

      return {
        source,
        campaignId: normalizeCampaign(saved?.campaignId),
        referrerHost: normalizeReferrerHost(saved?.referrerHost)
      };
    } catch (error) {
      storageRemove(localStorage, ATTRIBUTION_KEY);
      return null;
    }
  }

  function rememberAttribution(attribution) {
    if (!attribution?.source || attribution.source === "direct") return;
    storageSet(localStorage, ATTRIBUTION_KEY, JSON.stringify({
      source: attribution.source,
      campaignId: attribution.campaignId || "",
      referrerHost: attribution.referrerHost || "",
      capturedAt: Date.now()
    }));
  }

  function resolveAttribution() {
    const params = new URLSearchParams(window.location.search);
    const campaignId = normalizeCampaign(
      params.get("cid") || params.get("utm_campaign") || params.get("campaign")
    );
    const explicit = normalizeSource(
      params.get("source") || params.get("src") || params.get("utm_source")
    );

    if (explicit) {
      const tagged = rememberSessionAttribution({
        source: explicit,
        sourceMethod: explicit === "direct" ? "direct" : "tagged",
        campaignId,
        referrerHost: "",
        landingPage: window.location.pathname || "/"
      });
      rememberAttribution(tagged);
      return tagged;
    }

    const referred = referrerAttribution();
    if (referred?.source) {
      const attribution = rememberSessionAttribution({
        source: referred.source,
        sourceMethod: "referrer",
        campaignId,
        referrerHost: referred.referrerHost || "",
        landingPage: window.location.pathname || "/"
      });
      rememberAttribution(attribution);
      return attribution;
    }

    const sessionAttribution = readSessionAttribution();
    if (sessionAttribution) return sessionAttribution;

    const inAppSource = normalizeSource(sourceFromInAppBrowser());
    if (inAppSource) {
      const inferred = rememberSessionAttribution({
        source: inAppSource,
        sourceMethod: "in_app",
        campaignId,
        referrerHost: "",
        landingPage: window.location.pathname || "/"
      });
      rememberAttribution(inferred);
      return inferred;
    }

    const stored = readStoredAttribution();
    if (stored) {
      return rememberSessionAttribution({
        ...stored,
        sourceMethod: "persisted",
        landingPage: window.location.pathname || "/"
      });
    }

    const legacySource = normalizeSource(storageGet(sessionStorage, SOURCE_KEY));
    if (legacySource && legacySource !== "direct") {
      return rememberSessionAttribution({
        source: legacySource,
        sourceMethod: "persisted",
        campaignId: "",
        referrerHost: "",
        landingPage: window.location.pathname || "/"
      });
    }

    return rememberSessionAttribution({
      source: "direct",
      sourceMethod: "direct",
      campaignId: "",
      referrerHost: "",
      landingPage: window.location.pathname || "/"
    });
  }

  function validVisitorId(value) {
    return /^[a-zA-Z0-9_-]{16,200}$/.test(String(value || ""));
  }

  function createVisitorId() {
    try {
      if (typeof crypto.randomUUID === "function") {
        return `mv_${crypto.randomUUID().replaceAll("-", "")}`;
      }

      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return `mv_${Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("")}`;
    } catch (error) {
      return `mv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    }
  }

  function visitorId() {
    const local = storageGet(localStorage, VISITOR_KEY);
    if (validVisitorId(local)) return local;

    const session = storageGet(sessionStorage, VISITOR_SESSION_KEY);
    if (validVisitorId(session)) return session;

    const created = createVisitorId();
    if (!storageSet(localStorage, VISITOR_KEY, created)) {
      storageSet(sessionStorage, VISITOR_SESSION_KEY, created);
    }
    return created;
  }

  const attribution = resolveAttribution();
  const visitor = visitorId();
  const visitKey = `${VISIT_PREFIX}:${attribution.source}`;

  window.ModingTracking = Object.freeze({
    ...attribution,
    confidence: attribution.sourceMethod === "tagged" || attribution.sourceMethod === "referrer"
      ? "confirmed"
      : attribution.sourceMethod === "direct"
        ? "unresolved"
        : "estimated",
    visitorId: visitor
  });

  if (/bot|crawl|crawler|spider|slurp|yeti|googlebot|bingbot|daumoa|ads-naver/i.test(navigator.userAgent || "")) return;
  if (storageGet(sessionStorage, visitKey) === "1") return;

  storageSet(sessionStorage, visitKey, "1");
  storageSet(sessionStorage, `moding_index_visit_tracked_v3:${attribution.source}`, "1");
  storageSet(sessionStorage, `moding_alliance_visit_tracked_v1:${attribution.source}`, "1");

  fetch(`${API_BASE}/track/visit`, {
    method: "POST",
    mode: "cors",
    cache: "no-store",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      "X-Moding-Visitor-ID": visitor
    },
    body: JSON.stringify({
      source: attribution.source,
      sourceMethod: attribution.sourceMethod,
      campaignId: attribution.campaignId,
      referrerHost: attribution.referrerHost,
      visitorId: visitor,
      landingPage: attribution.landingPage
    })
  })
    .then(response => {
      if (!response.ok) throw new Error("tracking request failed");
    })
    .catch(() => storageRemove(sessionStorage, visitKey));
})();

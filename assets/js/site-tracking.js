(() => {
  "use strict";

  const API_BASE = "https://flat-queen-f1fb.moding-inc.workers.dev";
  const SOURCE_KEY = "moding_tracking_source";
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
    kakaotalk: "kakao",
    kakao_talk: "kakao",
    insta: "instagram",
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

  function sourceFromReferrer() {
    if (!document.referrer) return "";

    try {
      const referrer = new URL(document.referrer);
      const querySource =
        referrer.searchParams.get("source") ||
        referrer.searchParams.get("src") ||
        referrer.searchParams.get("utm_source");

      if (querySource) return normalizeSource(querySource);

      const host = referrer.hostname.toLowerCase().replace(/^www\./, "");
      if (!host || host === "moding.app" || host.endsWith(".moding.app")) return "";
      if (/daangn\.com|karrotmarket\.com|karrot\.com/.test(host)) return "daangn";
      if (host === "naver.me" || host === "naver.com" || host.endsWith(".naver.com")) return "naver";
      if (host === "kakao.com" || host.endsWith(".kakao.com") || host.endsWith(".kakaocorp.com")) return "kakao";
      if (host === "google.com" || host.endsWith(".google.com") || /^google\.[a-z.]+$/.test(host)) return "google";
      if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
      if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
      if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com") return "facebook";
      if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host === "t.co") return "x";
      return "referral";
    } catch (error) {
      return "";
    }
  }

  function resolveSource() {
    const params = new URLSearchParams(window.location.search);
    const explicit = normalizeSource(
      params.get("source") || params.get("src") || params.get("utm_source")
    );

    if (explicit) {
      storageSet(sessionStorage, SOURCE_KEY, explicit);
      return explicit;
    }

    const referred = sourceFromReferrer();
    if (referred) {
      storageSet(sessionStorage, SOURCE_KEY, referred);
      return referred;
    }

    const saved = normalizeSource(storageGet(sessionStorage, SOURCE_KEY));
    if (saved) return saved;

    storageSet(sessionStorage, SOURCE_KEY, "direct");
    return "direct";
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

  const source = resolveSource();
  const visitor = visitorId();
  const visitKey = `${VISIT_PREFIX}:${source}`;

  window.ModingTracking = Object.freeze({ source, visitorId: visitor });

  if (/bot|crawl|crawler|spider|slurp|yeti|googlebot|bingbot|daumoa|ads-naver/i.test(navigator.userAgent || "")) return;
  if (storageGet(sessionStorage, visitKey) === "1") return;

  storageSet(sessionStorage, visitKey, "1");
  storageSet(sessionStorage, `moding_index_visit_tracked_v3:${source}`, "1");
  storageSet(sessionStorage, `moding_alliance_visit_tracked_v1:${source}`, "1");

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
      source,
      visitorId: visitor,
      landingPage: window.location.pathname || "/"
    })
  })
    .then(response => {
      if (!response.ok) throw new Error("tracking request failed");
    })
    .catch(() => storageRemove(sessionStorage, visitKey));
})();

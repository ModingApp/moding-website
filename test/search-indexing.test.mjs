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

const publicPages = [
  ["index.html", "https://moding.app/#website"],
  ["download.html", "https://moding.app/download.html#webpage"],
  ["about.html", "https://moding.app/about.html#webpage"],
  ["brand.html", "https://moding.app/brand.html#webpage"],
  ["services.html", "https://moding.app/services.html#webpage"],
  ["alliance.html", "https://moding.app/alliance.html#webpage"],
  ["faq.html", "https://moding.app/faq.html#webpage"]
];

const publicPageHtml = new Map(
  await Promise.all(
    publicPages.map(async ([fileName]) => [
      fileName,
      await readFile(new URL(`../${fileName}`, import.meta.url), "utf8")
    ])
  )
);

function readJsonLd(html) {
  return Array.from(
    html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    (match) => JSON.parse(match[1])
  );
}

function flattenJsonLd(documents) {
  return documents.flatMap((document) => document["@graph"] || [document]);
}

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

test("public page structured data is valid JSON and uses stable page ids", () => {
  for (const [fileName, expectedId] of publicPages) {
    const nodes = flattenJsonLd(readJsonLd(publicPageHtml.get(fileName)));
    assert.ok(
      nodes.some((node) => node["@id"] === expectedId),
      `${fileName} must expose ${expectedId}`
    );
  }
});

test("homepage explicitly connects all primary public pages", () => {
  const nodes = flattenJsonLd(readJsonLd(publicPageHtml.get("index.html")));
  const website = nodes.find(
    (node) => node["@id"] === "https://moding.app/#website"
  );
  const expectedParts = publicPages
    .slice(1)
    .map(([, expectedId]) => expectedId);

  assert.deepEqual(
    website.hasPart.map((part) => part["@id"]),
    expectedParts
  );
});

test("homepage final search copy and core indexing signals remain locked", () => {
  const homepage = publicPageHtml.get("index.html");

  assert.match(
    homepage,
    /<title>모딩\(Moding\) \| 사장님의 가게에 새로운 선택지를<\/title>/
  );
  assert.match(
    homepage,
    /<meta name="description" content="외식업 사장님을 위한 B2B 식품 거래 플랫폼 모딩입니다\. 우리가게에 필요한 다양한 수산물·육가공·소스·가공식품을 찾아보세요\.">/
  );
  assert.match(
    homepage,
    /<link rel="canonical" href="https:\/\/moding\.app\/">/
  );
  assert.match(
    homepage,
    /외식업 사장님을 위한 식자재 거래 플랫폼 모딩/
  );
  assert.doesNotMatch(
    homepage,
    /<a href="download\.html">앱 다운로드<\/a>/
  );
  assert.match(homepage, /href="\/download\.html"/);
});

test("primary child pages declare homepage membership and breadcrumbs", () => {
  for (const [fileName, expectedId] of publicPages.slice(1)) {
    const nodes = flattenJsonLd(readJsonLd(publicPageHtml.get(fileName)));
    const page = nodes.find((node) => node["@id"] === expectedId);
    const breadcrumb = nodes.find((node) => node["@type"] === "BreadcrumbList");

    assert.equal(page.isPartOf["@id"], "https://moding.app/#website");
    assert.equal(breadcrumb.itemListElement[0].item, "https://moding.app/");
    assert.equal(
      breadcrumb.itemListElement.at(-1).item,
      expectedId.replace(/#webpage$/, "")
    );
  }
});

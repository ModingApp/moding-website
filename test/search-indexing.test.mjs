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

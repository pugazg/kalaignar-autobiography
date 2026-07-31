#!/usr/bin/env node
// Validates public/data/app/manifest.v1.json against the app's data contract
// (mirrors mobile/src/data/types.ts → AppManifest). Run: npm run validate:manifest
//
// Exit 0 = valid, 1 = invalid or not found. Wire into CI to catch a manifest
// build that drifts from what the app expects.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv from "ajv";

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(here, "../../public/data/app/manifest.v1.json");

const nullableString = { type: ["string", "null"] };
const nullableInt = { type: ["integer", "null"] };

const chapterEntry = {
  type: "object",
  required: ["id", "title", "textUrl"],
  properties: {
    id: { type: "string", pattern: "^v\\d+-ch\\d+$" },
    title: { type: "string" },
    startPage: nullableInt,
    endPage: nullableInt,
    textUrl: { type: "string" },
    textEnUrl: nullableString,
    visualsUrl: nullableString,
  },
  additionalProperties: true,
};

const volumeEntry = {
  type: "object",
  required: ["n", "chapterCount", "chapters"],
  properties: {
    n: { type: "integer", minimum: 1 },
    titleTa: nullableString,
    titleEn: nullableString,
    period: nullableString,
    serialisedIn: nullableString,
    chapterCount: { type: "integer", minimum: 0 },
    pages: nullableInt,
    searchIndexUrl: nullableString,
    chapters: { type: "array", items: chapterEntry },
  },
  additionalProperties: true,
};

const murasoliEntry = {
  type: ["object", "null"],
  required: ["title", "indexUrl", "totalLetters"],
  properties: {
    title: {},
    indexUrl: { type: "string" },
    lettersIndexUrl: { type: "string" },
    letterUrlTemplate: { type: "string" },
    letterEnUrlTemplate: { type: "string" },
    volumeCount: nullableInt,
    totalLetters: { type: "integer", minimum: 0 },
  },
  additionalProperties: true,
};

const schema = {
  type: "object",
  required: ["schemaVersion", "contentVersion", "work", "volumes", "features"],
  properties: {
    schemaVersion: { type: "integer" },
    contentVersion: { type: "string", minLength: 1 },
    generatedAt: { type: "string" },
    dataBase: { type: "string" },
    work: {
      type: "object",
      required: ["titleTa", "titleEn", "author"],
      properties: {
        titleTa: { type: "string" },
        titleEn: { type: "string" },
        author: { type: "string" },
        siteUrl: { type: "string" },
      },
      additionalProperties: true,
    },
    volumes: { type: "array", minItems: 1, items: volumeEntry },
    murasoli: murasoliEntry,
    features: {
      type: "object",
      properties: {
        timeline: nullableString,
        governance: nullableString,
        people: nullableString,
        places: nullableString,
        themes: nullableString,
        quotes: nullableString,
        stats: nullableString,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  fail(`Could not read/parse ${manifestPath}: ${e.message}`);
}

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error(`✗ manifest.v1.json is INVALID (${validate.errors.length} error(s)):`);
  for (const err of validate.errors) {
    console.error(`  · ${err.instancePath || "/"} ${err.message}`);
  }
  process.exit(1);
}

// Cross-checks beyond the schema.
const problems = [];
for (const v of data.volumes) {
  if (v.chapters.length !== v.chapterCount) {
    problems.push(`Volume ${v.n}: chapterCount=${v.chapterCount} but ${v.chapters.length} chapters inlined`);
  }
}
const ids = data.volumes.flatMap((v) => v.chapters.map((c) => c.id));
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) problems.push(`Duplicate chapter ids: ${[...new Set(dupes)].join(", ")}`);

if (problems.length) {
  console.error("✗ manifest.v1.json failed cross-checks:");
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}

const totalChapters = ids.length;
console.log(
  `✓ manifest.v1.json valid — schemaVersion ${data.schemaVersion}, ` +
    `${data.volumes.length} volumes, ${totalChapters} chapters, ` +
    `content ${String(data.contentVersion).slice(0, 8)}`,
);

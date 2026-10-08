#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const { PNG } = require("pngjs");
const { Resvg } = require("@resvg/resvg-js");

const appRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(appRoot, "public/logo-ministere.svg");
const outputPath = path.join(appRoot, "public/logo-ministere.generated.png");
const fontFiles = [
  path.join(appRoot, "public/font/Marianne-Regular.ttf"),
  path.join(appRoot, "public/font/Marianne-Bold.ttf"),
];
const expectedPixelSha256 = "0341d1305b0e2d2618a09e41e981b8aa16baa17fbe794ced8d00bc2aadaba027";
const expectedWidth = 200;
const expectedHeight = 94;

function renderLogo(svg) {
  const result = new Resvg(svg, {
    background: "#fff",
    font: { fontFiles, loadSystemFonts: false },
    shapeRendering: 2,
    textRendering: 2,
  }).render();
  assert.equal(result.width, expectedWidth, "Ministry logo width changed");
  assert.equal(result.height, expectedHeight, "Ministry logo height changed");
  const png = result.asPng();
  return { image: PNG.sync.read(png), png };
}

function pixel(image, x, y) {
  const offset = (y * image.width + x) * 4;
  return Array.from(image.data.subarray(offset, offset + 4));
}

function countPixels(image, x1, y1, x2, y2, isInk) {
  let count = 0;
  for (let y = y1; y < y2; y += 1) {
    for (let x = x1; x < x2; x += 1) {
      if (isInk(pixel(image, x, y))) count += 1;
    }
  }
  return count;
}

function pixelSha256(image) {
  return createHash("sha256").update(image.data).digest("hex");
}

async function main() {
  const startedAt = performance.now();
  const svg = await fs.readFile(sourcePath, "utf8");
  const first = renderLogo(svg);
  const second = renderLogo(svg);
  const image = first.image;
  const firstHash = pixelSha256(image);
  assert.equal(firstHash, pixelSha256(second.image), "Logo rendering is not deterministic");
  assert.equal(firstHash, expectedPixelSha256, "Rendered pixels differ from the reviewed logo");
  assert.deepEqual(pixel(image, 3, 3), [0, 0, 145, 255], "Marianne mark lost its blue area");
  assert.deepEqual(pixel(image, 40, 3), [225, 0, 15, 255], "Marianne mark lost its red area");
  assert.deepEqual(pixel(image, 199, 93), [255, 255, 255, 255], "Logo background is not white");
  assert.ok(
    countPixels(image, 0, 0, 44, 18, ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) > 80) > 350,
    "Marianne mark does not contain the expected tricolour coverage",
  );
  assert.ok(
    countPixels(image, 0, 20, 200, 57, ([r, g, b]) => Math.min(r, g, b) < 80) > 1200,
    "Ministry title is missing or incomplete",
  );
  assert.ok(
    countPixels(image, 0, 60, 44, 92, ([r, g, b]) => Math.min(r, g, b) < 120) > 100,
    "Republican motto is missing or incomplete",
  );

  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporaryPath, first.png);
    await fs.rename(temporaryPath, outputPath);
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }
  process.stdout.write(
    `Generated ministry logo (${expectedWidth}x${expectedHeight}, ${firstHash}, ${(
      performance.now() - startedAt
    ).toFixed(1)} ms)\n`,
  );
}

main().catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});

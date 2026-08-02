import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

test("builds the React photobook shell", () => {
  const html = readFileSync("dist/index.html", "utf8");
  const assets = readdirSync("dist/assets");

  assert.match(html, /우리의 추억 포토북/);
  assert.match(html, /\/assets\/.*\.js/);
  assert.match(html, /\/assets\/.*\.css/);
  assert.ok(assets.some((asset) => asset.endsWith(".js")));
  assert.ok(assets.some((asset) => asset.endsWith(".css")));
  assert.ok(existsSync("dist/photos/img1.jpg"));
  assert.doesNotMatch(html, /__next|_next|vinext|react-server-dom/i);
});

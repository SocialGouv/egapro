#!/usr/bin/env node
import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../node_modules/swagger-ui-dist");
const dest = resolve(__dirname, "../public/swagger-ui");

mkdirSync(dest, { recursive: true });

for (const file of [
	"swagger-ui-bundle.js",
	"swagger-ui-standalone-preset.js",
	"swagger-ui.css",
]) {
	cpSync(resolve(src, file), resolve(dest, file));
}

console.log("✓ Swagger UI assets copied to public/swagger-ui/");

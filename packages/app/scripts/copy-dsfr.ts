#!/usr/bin/env node
import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../node_modules/@gouvfr/dsfr/dist");
const dest = resolve(__dirname, "../public/dsfr");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log("✓ DSFR assets copied to public/dsfr/");

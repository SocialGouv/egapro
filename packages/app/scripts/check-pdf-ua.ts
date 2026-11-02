#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pdfDocumentSamples } from "~/modules/declarationPdf/__tests__/helpers/pdfDocumentFixtures";
import { registerPdfFonts } from "~/modules/declarationPdf/__tests__/helpers/registerPdfFonts";
import { renderTaggedPdf } from "~/modules/declarationPdf/tagging/renderTaggedPdf";

// Validates every generated PDF against PDF/UA-1 with veraPDF, which needs a
// Java runtime and therefore stays out of CI: run `pnpm check:pdf-ua` locally
// after touching src/modules/declarationPdf. The CI-side guard is the vitest
// suite taggedPdfDocuments.test.tsx.

const outputDirectory =
	process.argv[2] ?? mkdtempSync(join(tmpdir(), "pdf-ua-"));

const verapdf = spawnSync("verapdf", ["--version"], { encoding: "utf8" });
if (verapdf.error) {
	console.error(
		"veraPDF est introuvable : installez-le (https://verapdf.org/software/) puis relancez.",
	);
	process.exit(2);
}

registerPdfFonts({ hyphenation: true });

let failures = 0;
for (const sample of pdfDocumentSamples()) {
	const file = join(outputDirectory, `${sample.name}.pdf`);
	writeFileSync(file, await renderTaggedPdf(sample.element));

	const result = spawnSync(
		"verapdf",
		["--flavour", "ua1", "--format", "text", file],
		{ encoding: "utf8" },
	);
	const report = result.stdout.trim();
	console.log(report);
	if (!report.startsWith("PASS")) failures += 1;
}

console.log(`\n${outputDirectory}`);
process.exit(failures === 0 ? 0 : 1);

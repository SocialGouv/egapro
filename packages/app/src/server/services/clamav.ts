import "server-only";

import { createScanner, isCleanReply } from "clamdjs";

import { env } from "~/env";

type ScanResult = {
	clean: boolean;
	viruses: string[];
};

export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
	const scanner = createScanner(env.CLAMAV_HOST, env.CLAMAV_PORT);
	const reply = await scanner.scanBuffer(buffer, 30_000);

	if (isCleanReply(reply)) {
		return { clean: true, viruses: [] };
	}

	const viruses = reply
		.replace(/\0/g, "")
		.split("\n")
		.filter((line: string) => line.includes("FOUND"))
		.map((line: string) =>
			line
				.replace(/^.*:\s*/, "")
				.replace(/\s*FOUND\s*$/, "")
				.trim(),
		)
		.filter(Boolean);

	return { clean: false, viruses };
}

import { isDevEnvironment } from "~/server/config/mockAssets.js";

export function assertDemoSeedAllowed(): void {
	const deployEnv = process.env.NEXT_PUBLIC_EGAPRO_ENV;
	if (isDevEnvironment(deployEnv)) return;

	console.error(
		`[demo-seed] refusing to write demo data: NEXT_PUBLIC_EGAPRO_ENV is "${deployEnv}". Demo seeds run in dev only.`,
	);
	process.exit(1);
}

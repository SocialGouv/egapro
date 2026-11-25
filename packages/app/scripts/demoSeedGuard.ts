const DEMO_ONLY_ENV = "dev";

export function isDemoSeedAllowed(deployEnv: string | undefined): boolean {
	return (
		deployEnv === undefined || deployEnv === "" || deployEnv === DEMO_ONLY_ENV
	);
}

export function assertDemoSeedAllowed(): void {
	const deployEnv = process.env.NEXT_PUBLIC_EGAPRO_ENV;
	if (isDemoSeedAllowed(deployEnv)) return;

	console.error(
		`[demo-seed] refusing to write demo data: NEXT_PUBLIC_EGAPRO_ENV is "${deployEnv}". Demo seeds run in dev only.`,
	);
	process.exit(1);
}

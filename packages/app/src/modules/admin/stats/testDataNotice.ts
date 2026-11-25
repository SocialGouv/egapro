export function shouldShowTestDataNotice(
	deployEnv: string | undefined,
): boolean {
	return deployEnv === "dev";
}

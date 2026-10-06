const HOME_PATH = "/mon-espace";

function isRelativePath(url: string): boolean {
	return url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\");
}

function isSameOrigin(url: string, baseUrl: string): boolean {
	try {
		return new URL(url).origin === new URL(baseUrl).origin;
	} catch {
		return false;
	}
}

export function resolveRedirectTarget(url: string, baseUrl: string): string {
	const home = `${baseUrl}${HOME_PATH}`;

	if (isRelativePath(url)) {
		return url === "/" ? home : `${baseUrl}${url}`;
	}

	if (!isSameOrigin(url, baseUrl)) return home;

	const { pathname } = new URL(url);
	return pathname === "/" && !url.includes("?") && !url.includes("#")
		? home
		: url;
}

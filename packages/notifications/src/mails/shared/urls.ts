function trimTrailingSlash(url: string): string {
	return url.replace(/\/$/, "");
}

export function getPublicUrl(): string {
	const url = process.env.EGAPRO_PUBLIC_URL ?? "https://egapro.travail.gouv.fr";
	return trimTrailingSlash(url);
}

export function getMySpaceUrl(): string {
	return `${getPublicUrl()}/mon-espace`;
}

export function getConnectionUrl(): string {
	return `${getPublicUrl()}/connexion`;
}

export function getDeclarationUrl(siren: string, year: number): string {
	return `${getPublicUrl()}/declaration?siren=${encodeURIComponent(siren)}&year=${year}`;
}

export function getAssetUrl(path: string): string {
	const cleaned = path.replace(/^\/+/, "");
	return `${getPublicUrl()}/assets/email/${cleaned}`;
}

export function getImageUrl(path: string): string {
	const cleaned = path.replace(/^\/+/, "");
	return `${getPublicUrl()}/assets/images/mails/${cleaned}`;
}

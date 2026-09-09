// Deliberately outside DownloadCard.tsx: that module is "use client", and every
// export of a client module becomes a client reference, so a Server Component
// importing this helper from there would crash when it calls it.
export function formatDocumentSubtitle(year: number, dataYear: number): string {
	return `Année ${year} au titre des données ${dataYear}`;
}

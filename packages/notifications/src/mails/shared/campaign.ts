// The worker lives outside `~/modules/domain` (no `app` dependency, no `~/` alias), so it mirrors the domain rule of the same name instead of importing it — see `dates.ts`.
export function getRepresentationCampaignYear(referenceYear: number): number {
	return referenceYear + 1;
}

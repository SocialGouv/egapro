type DsfrCollapseApi = { disclose: () => void; conceal: () => void };

export function getDsfrCollapse(element: HTMLElement): DsfrCollapseApi | null {
	if (!("dsfr" in window)) return null;
	const api = (
		window as unknown as {
			dsfr: (el: HTMLElement) => { collapse?: DsfrCollapseApi } | null;
		}
	).dsfr(element);
	return api?.collapse ?? null;
}

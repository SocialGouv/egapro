type DsfrModalApi = {
	disclose: () => void;
	conceal: () => void;
	focus: () => void;
};

export function getDsfrModal(element: HTMLElement): DsfrModalApi | null {
	if (!("dsfr" in window)) return null;
	return (
		window as unknown as {
			dsfr: (el: HTMLElement) => { modal: DsfrModalApi };
		}
	).dsfr(element).modal;
}

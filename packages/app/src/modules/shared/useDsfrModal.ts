import { useCallback, useRef } from "react";

import { getDsfrModal } from "./getDsfrModal";

export function useDsfrModal() {
	const modalRef = useRef<HTMLDialogElement>(null);

	const open = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.disclose();
		}
	}, []);

	const close = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.conceal();
		}
	}, []);

	return { modalRef, open, close };
}

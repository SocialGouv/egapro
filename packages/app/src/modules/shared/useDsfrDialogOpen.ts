import { type RefObject, useEffect } from "react";

export function useDsfrDialogOpen(
	dialogRef: RefObject<HTMLDialogElement | null>,
	onOpen: () => void,
) {
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === "open" && dialog.open) {
					onOpen();
					break;
				}
			}
		});

		observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
		return () => observer.disconnect();
	}, [dialogRef, onOpen]);
}

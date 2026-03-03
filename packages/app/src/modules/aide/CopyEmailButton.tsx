"use client";

import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "error";

type Props = {
	email: string;
};

/** Small button that copies an email address to the clipboard. */
export function CopyEmailButton({ email }: Props) {
	const [state, setState] = useState<CopyState>("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(email);
			setState("copied");
		} catch {
			setState("error");
		}
		timerRef.current = setTimeout(() => setState("idle"), 2000);
	}

	const labelMap: Record<CopyState, string> = {
		idle: "Copier",
		copied: "Copié !",
		error: "Échec de la copie",
	};

	const ariaLabelMap: Record<CopyState, string> = {
		idle: `Copier l'adresse ${email}`,
		copied: "Adresse copiée dans le presse-papier",
		error: "La copie a échoué, copiez l'adresse manuellement",
	};

	return (
		<button
			aria-label={ariaLabelMap[state]}
			className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-clipboard-line fr-btn--icon-left"
			onClick={handleCopy}
			type="button"
		>
			{labelMap[state]}
		</button>
	);
}

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
	email: string;
};

/** Small button that copies an email address to the clipboard. */
export function CopyEmailButton({ email }: Props) {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(email);
			setCopied(true);
			timerRef.current = setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API unavailable (e.g. insecure context)
		}
	}

	const label = copied ? "Copié !" : "Copier";
	const ariaLabel = copied
		? "Adresse copiée dans le presse-papier"
		: `Copier l'adresse ${email}`;

	return (
		<button
			aria-label={ariaLabel}
			className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-clipboard-line fr-btn--icon-left"
			onClick={handleCopy}
			type="button"
		>
			{label}
		</button>
	);
}

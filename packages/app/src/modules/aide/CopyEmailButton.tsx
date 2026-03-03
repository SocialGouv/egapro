"use client";

import { useState } from "react";

type Props = {
	email: string;
};

/** Small button that copies an email address to the clipboard. */
export function CopyEmailButton({ email }: Props) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(email);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API unavailable (e.g. insecure context)
		}
	}

	return (
		<button
			className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-clipboard-line fr-btn--icon-left"
			onClick={handleCopy}
			type="button"
		>
			{copied ? "Copié !" : "Copier"}
		</button>
	);
}

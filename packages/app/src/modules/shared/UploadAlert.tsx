"use client";

import type { UploadError } from "./uploadErrors";

type Props = {
	error: UploadError;
	onClose: () => void;
};

export function UploadAlert({ error, onClose }: Props) {
	return (
		<div className="fr-alert fr-alert--error" role="alert">
			<p className="fr-alert__title">{error.title}</p>
			<p>{error.message}</p>
			<button
				className="fr-btn fr-btn--close"
				onClick={onClose}
				title="Masquer le message"
				type="button"
			>
				Masquer le message
			</button>
		</div>
	);
}

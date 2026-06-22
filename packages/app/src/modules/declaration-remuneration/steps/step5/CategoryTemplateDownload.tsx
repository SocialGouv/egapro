"use client";

import { useState } from "react";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { generateTemplate } from "./categoryFileHandler";
import { startCategoryModelTimer } from "./categoryModelTracking";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	categories: EmployeeCategory[];
	disabled?: boolean;
};

const TEMPLATE_FORMATS = [
	{ format: "xlsx", label: "Télécharger le modèle (.xlsx)" },
	{ format: "csv", label: "Télécharger le modèle (.csv)" },
] as const;

export function CategoryTemplateDownload({
	categories,
	disabled = false,
}: Props) {
	const [hasError, setHasError] = useState(false);

	async function handleDownload(format: "xlsx" | "csv") {
		setHasError(false);
		try {
			startCategoryModelTimer();
			const blob = await generateTemplate(categories, format);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `modele-categories.${format}`;
			link.click();
			URL.revokeObjectURL(url);
			trackEvent({
				category: MATOMO_EVENT_CATEGORY.DOCUMENT,
				action: MATOMO_ACTION.CATEGORY_TEMPLATE_DOWNLOAD,
				name: format,
			});
		} catch {
			setHasError(true);
		}
	}

	return (
		<div>
			<ul className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--sm">
				{TEMPLATE_FORMATS.map(({ format, label }) => (
					<li key={format}>
						<button
							className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
							disabled={disabled}
							onClick={() => handleDownload(format)}
							type="button"
						>
							{label}
						</button>
					</li>
				))}
			</ul>
			{hasError && (
				<p aria-live="polite" className="fr-error-text">
					Le téléchargement du modèle a échoué. Veuillez réessayer.
				</p>
			)}
		</div>
	);
}

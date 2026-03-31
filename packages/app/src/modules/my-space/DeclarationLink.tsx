"use client";

import { hasRequiredDeclarationInfo } from "~/modules/domain";

import { DECLARATION_PROCESS_PANEL_ID } from "./DeclarationProcessPanel";
import type { DeclarationType } from "./types";

const MISSING_INFO_MODAL_ID = "missing-info-modal";

type Props = {
	siren: string;
	type: DeclarationType;
	userPhone: string | null;
	hasCse: boolean | null;
	children: React.ReactNode;
};

/** Link that opens the missing info modal if phone or CSE is missing, or navigates/opens panel directly. */
export function DeclarationLink({
	siren,
	type,
	userPhone,
	hasCse,
	children,
}: Props) {
	const hasMissingInfo = !hasRequiredDeclarationInfo(userPhone, hasCse);

	// When info is missing, open missing-info modal (for both types)
	if (hasMissingInfo) {
		return (
			<button
				aria-controls={MISSING_INFO_MODAL_ID}
				className="fr-link"
				data-declaration-type={type}
				data-fr-opened="false"
				type="button"
			>
				{children}
			</button>
		);
	}

	// Remuneration: open the declaration process side panel
	if (type === "remuneration") {
		return (
			<button
				aria-controls={DECLARATION_PROCESS_PANEL_ID}
				className="fr-link"
				data-fr-opened="false"
				type="button"
			>
				{children}
			</button>
		);
	}

	// Representation: placeholder (no route yet)
	return (
		<button className="fr-link" type="button">
			{children}
		</button>
	);
}

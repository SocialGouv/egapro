"use client";

import { useIsImpersonating } from "~/modules/auth";
import { hasRequiredDeclarationInfo } from "~/modules/domain";
import { DECLARATION_PROCESS_PANEL_ID } from "./DeclarationProcessPanel";
import styles from "./DeclarationsSection.module.scss";
import type { DeclarationType } from "./types";

const MISSING_INFO_MODAL_ID = "missing-info-modal";
const linkClass = `fr-link ${styles.linkUnderlined}`;

type Props = {
	type: DeclarationType;
	userPhone: string | null;
	hasCse: boolean | null;
	children: React.ReactNode;
};

/** Link that opens the missing info modal if phone or CSE is missing, or navigates/opens panel directly. */
export function DeclarationLink({ type, userPhone, hasCse, children }: Props) {
	const isImpersonating = useIsImpersonating();
	const hasMissingInfo =
		!isImpersonating && !hasRequiredDeclarationInfo(userPhone, hasCse);

	// When info is missing, open missing-info modal (for both types)
	if (hasMissingInfo) {
		return (
			<button
				aria-controls={MISSING_INFO_MODAL_ID}
				className={linkClass}
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
				className={linkClass}
				data-fr-opened="false"
				type="button"
			>
				{children}
			</button>
		);
	}

	// Representation: placeholder (no route yet)
	return (
		<button className={linkClass} type="button">
			{children}
		</button>
	);
}

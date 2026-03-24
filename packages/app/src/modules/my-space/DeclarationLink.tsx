"use client";

import Link from "next/link";

import type { DeclarationType } from "./types";

const MISSING_INFO_MODAL_ID = "missing-info-modal";

const TYPE_HREFS: Record<DeclarationType, (siren: string) => string> = {
	remuneration: (siren) => `/declaration-remuneration?siren=${siren}`,
	representation: () => "#",
};

type Props = {
	siren: string;
	type: DeclarationType;
	userPhone: string | null;
	hasCse: boolean | null;
	children: React.ReactNode;
};

/** Link that opens the missing info modal if phone or CSE is missing, or navigates directly. */
export function DeclarationLink({
	siren,
	type,
	userPhone,
	hasCse,
	children,
}: Props) {
	if (userPhone && hasCse !== null) {
		return <Link href={TYPE_HREFS[type](siren)}>{children}</Link>;
	}

	return (
		<button
			aria-controls={MISSING_INFO_MODAL_ID}
			className="fr-link"
			data-fr-opened="false"
			type="button"
		>
			{children}
		</button>
	);
}

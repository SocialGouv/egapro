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
	children: React.ReactNode;
};

/** Link that opens the missing info modal if phone is missing, or navigates directly. */
export function DeclarationLink({ siren, type, userPhone, children }: Props) {
	if (userPhone) {
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

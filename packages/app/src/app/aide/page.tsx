import type { Metadata } from "next";

import { AidePage } from "~/modules/aide";

export const metadata: Metadata = {
	title: "Aide et ressources",
	description:
		"Retrouvez toutes les ressources pour comprendre et réaliser votre déclaration des indicateurs d'égalité professionnelle.",
};

// Reads live campaign settings from the DB (admins can change them anytime).
export const dynamic = "force-dynamic";

export default function Page() {
	return <AidePage />;
}

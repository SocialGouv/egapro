import type { Metadata } from "next";

import { PublicStatsPage } from "~/modules/publicStats";
import { HydrateClient } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Statistiques publiques — Égalité professionnelle",
	description:
		"Taux de déclaration et répartition des écarts de rémunération entre les femmes et les hommes en France.",
};

export default function Page() {
	return (
		<HydrateClient>
			<PublicStatsPage />
		</HydrateClient>
	);
}

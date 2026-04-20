import type { Metadata } from "next";

import { PublicReferentsPage } from "~/modules/referents";
import { HydrateClient } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Référents Égalité Professionnelle",
	description:
		"Trouvez le référent Égalité Professionnelle de votre région ou de votre département. Recherche par région, département ou nom.",
};

export default function Page() {
	return (
		<HydrateClient>
			<PublicReferentsPage />
		</HydrateClient>
	);
}

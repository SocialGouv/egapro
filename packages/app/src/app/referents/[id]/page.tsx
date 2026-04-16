import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicReferentDetail } from "~/modules/referents";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "Référent Égalité Professionnelle",
	description:
		"Coordonnées du référent Égalité Professionnelle : contact principal et suppléant.",
};

type Props = {
	params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
	const { id } = await params;

	const referent = await api.publicReferents.getById({ id }).catch(() => null);

	if (!referent) {
		notFound();
	}

	return <PublicReferentDetail referent={referent} />;
}

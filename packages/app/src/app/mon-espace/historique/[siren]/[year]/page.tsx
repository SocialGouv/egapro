import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DeclarationHistoryPage } from "~/modules/declarationHistory";
import { auth } from "~/server/auth";

type Props = {
	params: Promise<{ siren: string; year: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { year } = await params;
	return {
		title: `Historique des modifications ${year} — Egapro`,
	};
}

export default async function Page({ params }: Props) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const { siren, year: yearParam } = await params;
	const year = Number.parseInt(yearParam, 10);

	if (siren.length !== 9 || Number.isNaN(year) || year < 2018) {
		notFound();
	}

	return <DeclarationHistoryPage siren={siren} year={year} />;
}

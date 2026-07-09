import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DeclarationHistoryPage } from "~/modules/declarationHistory";
import { FIRST_DECLARATION_YEAR } from "~/modules/domain";
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

	if (
		siren.length !== 9 ||
		Number.isNaN(year) ||
		year < FIRST_DECLARATION_YEAR
	) {
		notFound();
	}

	return <DeclarationHistoryPage siren={siren} year={year} />;
}

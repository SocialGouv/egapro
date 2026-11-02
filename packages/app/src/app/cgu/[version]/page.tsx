import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { formatIsoDate } from "~/modules/domain";
import { resolveTermsOfUseVersion, TermsOfUsePage } from "~/modules/legal";
import { CGU } from "~/modules/routes";

type Props = {
	params: Promise<{ version: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { version } = await params;
	const lookup = resolveTermsOfUseVersion(version);
	if (lookup.kind !== "archived") {
		return { title: "Conditions générales d'utilisation" };
	}
	return {
		title: `Conditions générales d'utilisation — version du ${formatIsoDate(
			lookup.version.effectiveDate,
		)}`,
	};
}

export default async function Page({ params }: Props) {
	const { version } = await params;
	const lookup = resolveTermsOfUseVersion(version);

	if (lookup.kind === "not-found") {
		notFound();
	}
	if (lookup.kind === "current") {
		redirect(CGU);
	}

	return <TermsOfUsePage isCurrent={false} version={lookup.version} />;
}

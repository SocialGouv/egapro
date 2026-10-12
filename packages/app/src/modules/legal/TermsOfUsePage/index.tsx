import Link from "next/link";

import { formatIsoDate } from "~/modules/domain";
import { Breadcrumb } from "~/modules/layout";
import { CGU } from "~/modules/routes";

import { TermsOfUseVersionHistory } from "./TermsOfUseVersionHistory";
import {
	TERMS_OF_USE_VERSIONS,
	type TermsOfUseVersion,
} from "./termsOfUseVersions";

export {
	getCurrentTermsOfUseVersion,
	resolveTermsOfUseVersion,
} from "./termsOfUseVersions";

type Props = {
	version: TermsOfUseVersion;
	isCurrent: boolean;
	versions?: readonly TermsOfUseVersion[];
};

/** CGU page template, shared by the in-force page (`/cgu`) and its archives (`/cgu/[version]`). */
export function TermsOfUsePage({
	version,
	isCurrent,
	versions = TERMS_OF_USE_VERSIONS,
}: Props) {
	const { Content, effectiveDate } = version;
	const formattedDate = formatIsoDate(effectiveDate);
	const breadcrumbItems = isCurrent
		? [
				{ label: "Accueil", href: "/" },
				{ label: "Conditions générales d'utilisation" },
			]
		: [
				{ label: "Accueil", href: "/" },
				{ label: "Conditions générales d'utilisation", href: CGU },
				{ label: `Version du ${formattedDate}` },
			];

	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb items={breadcrumbItems} />

				<h1 className="fr-h1 fr-mt-4w">Conditions générales d'utilisation</h1>

				{isCurrent ? (
					<>
						<p>En vigueur à partir du {formattedDate}</p>
						<p>
							<a href="#historique-des-versions">
								Consulter l'historique des versions
							</a>
						</p>
					</>
				) : (
					<>
						<p>Version du {formattedDate}</p>
						<div className="fr-alert fr-alert--info fr-alert--sm fr-mb-3w">
							<p>
								Cette version n'est plus en vigueur.{" "}
								<Link href={CGU}>Consulter la version en vigueur</Link>
							</p>
						</div>
					</>
				)}

				<Content />

				<TermsOfUseVersionHistory
					versions={versions}
					viewedEffectiveDate={effectiveDate}
				/>
			</div>
		</main>
	);
}

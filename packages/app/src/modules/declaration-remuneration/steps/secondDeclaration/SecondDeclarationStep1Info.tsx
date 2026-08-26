"use client";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { DraftLoadingState } from "~/modules/declaration-remuneration/shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { formatLongDate } from "~/modules/domain";
import { BASE_PATH } from "./constants";
import styles from "./SecondDeclarationStep1Info.module.scss";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

const EMPTY_DB_VALUES = {} as Record<string, never>;

type Props = {
	declarationDate: string;
	declarationSiren: string;
	declarationYear: number;
	modificationDeadline: Date;
};

export function SecondDeclarationStep1Info({
	declarationDate,
	declarationSiren,
	declarationYear,
	modificationDeadline,
}: Props) {
	const { isLoadingDraft } = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: "second-1",
		kind: "second",
		dbValues: EMPTY_DB_VALUES,
	});

	if (isLoadingDraft) {
		return <DraftLoadingState />;
	}

	return (
		<div className={common.flexColumnGap2}>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégories
					de salariés
				</h1>
				<SavedIndicator hasData={true} />
			</div>

			<SecondDeclarationStepIndicator currentStep={1} />

			<p className={`fr-mb-0 ${common.fontMedium} ${styles.introText}`}>
				Vous devez mettre en œuvre des <strong>actions correctives</strong> et
				effectuer une{" "}
				<strong>
					seconde déclaration de l&apos;indicateur par catégories de salariés
				</strong>
				.
			</p>

			<DeadlineBlock
				deadline={modificationDeadline}
				declarationDate={declarationDate}
			/>

			<ObligationsCallout />

			<FormActions
				className="fr-mt-0"
				nextHref={`${BASE_PATH}/etape/2`}
				nextLabel="Suivant"
				previousHref={BASE_PATH}
			/>
		</div>
	);
}

function DeadlineBlock({
	deadline,
	declarationDate,
}: {
	deadline: Date;
	declarationDate: string;
}) {
	return (
		<div className={`fr-highlight ${common.flexColumnGapHalf}`}>
			<p className="fr-mb-0">Date limite</p>
			<p className="fr-mb-0 fr-text--lead fr-text--bold">
				{formatLongDate(deadline)}
			</p>
			<p className="fr-mb-0 fr-text-mention--grey">
				Déclaration effectuée le {declarationDate}
			</p>
		</div>
	);
}

function ObligationsCallout() {
	return (
		<div className={`fr-callout ${styles.obligationsCallout}`}>
			<h3 className="fr-callout__title fr-h6">
				Ce que vous devez faire dans un délai de 6 mois
			</h3>
			<div className="fr-callout__text">
				<ul className="fr-mb-0">
					<li>
						Mettre en place des actions correctives par accord ou plan
						d&apos;action
					</li>
					<li>
						Redéclarer l&apos;indicateur dans un délai de 6 mois après votre
						première déclaration
					</li>
					<li>
						Informer et consulter votre CSE sur l&apos;exactitude des données et
						éventuellement sur la justification en cas d&apos;écarts ≥ 5 %
					</li>
					<li>Transmettre l&apos;avis ou les avis du CSE</li>
				</ul>
			</div>
		</div>
	);
}

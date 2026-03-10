import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { BASE_PATH } from "./constants";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

type Props = {
	currentYear: number;
	declarationDate: string;
};

export function SecondDeclarationStep1Info({
	currentYear,
	declarationDate,
}: Props) {
	const deadline = `1\u1D49\u02B3 décembre ${currentYear}`;

	return (
		<div className={common.flexColumnGap2}>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégorie de
					salariés
				</h1>
				<SavedIndicator />
			</div>

			<SecondDeclarationStepIndicator currentStep={1} />

			<p className="fr-mb-0">
				Vous devez mettre en œuvre des <strong>actions correctives</strong> et
				effectuer une{" "}
				<strong>
					seconde déclaration de l&apos;indicateur par catégorie de salariés
				</strong>
				.
			</p>

			<DeadlineBlock deadline={deadline} declarationDate={declarationDate} />

			<ObligationsCallout />

			<FormActions
				nextHref={`${BASE_PATH}/etape/2`}
				nextLabel="Suivant"
				previousHref={BASE_PATH}
			/>
		</div>
	);
}

// -- Sub-components --

function DeadlineBlock({
	deadline,
	declarationDate,
}: {
	deadline: string;
	declarationDate: string;
}) {
	return (
		<div className="fr-pl-3w">
			<p className="fr-mb-0 fr-text--sm fr-text--mention-grey">Date limite</p>
			<p className="fr-h5 fr-mb-0">{deadline}</p>
			<p className="fr-mb-0 fr-text--sm fr-text--mention-grey">
				Déclaration effectuée le {declarationDate}
			</p>
		</div>
	);
}

function ObligationsCallout() {
	return (
		<div className="fr-callout">
			<h3 className="fr-callout__title">
				Ce que vous devez faire dans un délais de 6 mois
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

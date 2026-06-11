import { CompliancePathOption } from "./CompliancePathOption";
import type { CompliancePathValue } from "./constants";

export function getCompliancePathHref(path: CompliancePathValue): string {
	if (path === "corrective_action") {
		return "/declaration-remuneration/parcours-conformite/etape/1";
	}
	if (path === "joint_evaluation") {
		return "/declaration-remuneration/parcours-conformite/evaluation-conjointe";
	}
	return "/avis-cse";
}

export function JointEvaluationOption({
	checked,
	className,
	deadline,
	disabled,
	onChange,
}: {
	checked: boolean;
	className?: string;
	deadline: Date;
	disabled?: boolean;
	onChange: () => void;
}) {
	const elementClassName = ["fr-fieldset__element", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={elementClassName}>
			<CompliancePathOption
				checked={checked}
				deadline={deadline}
				disabled={disabled}
				id="path-joint"
				learnMoreHref="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
				learnMoreLabel="En savoir plus sur l'évaluation conjointe des rémunérations"
				name="compliance-path"
				onChange={onChange}
				title="Mettre en place une évaluation conjointe des rémunérations"
				value="joint_evaluation"
			>
				<p className="fr-mb-0">
					Vous choisissez de procéder à une évaluation conjointe des
					rémunérations afin d&apos;identifier et de corriger les écarts
					constatés :
				</p>
				<ul className="fr-mt-1w fr-mb-0">
					<li>
						Élaboration du rapport préalable (à déposer sur le portail Egapro)
					</li>
					<li>Analyse conjointe et définition des actions correctrices</li>
					<li>
						Mise en place de l&apos;accord collectif ou à défaut un plan
						d&apos;action
					</li>
				</ul>
			</CompliancePathOption>
		</div>
	);
}

export function JustifyOption({
	checked,
	deadline,
	disabled,
	onChange,
}: {
	checked: boolean;
	deadline: Date;
	disabled?: boolean;
	onChange: () => void;
}) {
	return (
		<div className="fr-fieldset__element">
			<CompliancePathOption
				checked={checked}
				deadline={deadline}
				disabled={disabled}
				id="path-justify"
				name="compliance-path"
				onChange={onChange}
				title="Justifier les écarts de rémunération ≥ 5 %"
				value="justify"
			>
				<p className="fr-mb-0">
					Vous avez la possibilité de justifier vos écarts par des critères
					objectifs et non sexistes :
				</p>
				<ul className="fr-mt-1w fr-mb-0">
					<li>Informer et consulter votre CSE sur cette justification</li>
					<li>Transmettre l&apos;avis du CSE</li>
				</ul>
			</CompliancePathOption>
		</div>
	);
}

export function SecondRoundOptions({
	disabled,
	justificationDeadline,
	jointEvaluationDeadline,
	selectedPath,
	setSelectedPath,
}: {
	disabled?: boolean;
	justificationDeadline: Date;
	jointEvaluationDeadline: Date;
	selectedPath: CompliancePathValue | undefined;
	setSelectedPath: (path: CompliancePathValue) => void;
}) {
	return (
		<>
			<JustifyOption
				checked={selectedPath === "justify"}
				deadline={justificationDeadline}
				disabled={disabled}
				onChange={() => setSelectedPath("justify")}
			/>

			<h2 className="fr-h6 fr-mt-3w fr-mb-0">
				Si la justification n&apos;est pas possible par des critères objectifs
				et non sexistes
			</h2>

			<JointEvaluationOption
				checked={selectedPath === "joint_evaluation"}
				className="fr-mt-2w"
				deadline={jointEvaluationDeadline}
				disabled={disabled}
				onChange={() => setSelectedPath("joint_evaluation")}
			/>
		</>
	);
}

export function FirstRoundOptions({
	correctiveActionDeadline,
	disabled,
	jointEvaluationDeadline,
	justificationDeadline,
	selectedPath,
	setSelectedPath,
}: {
	correctiveActionDeadline: Date;
	disabled?: boolean;
	jointEvaluationDeadline: Date;
	justificationDeadline: Date;
	selectedPath: CompliancePathValue | undefined;
	setSelectedPath: (path: CompliancePathValue) => void;
}) {
	return (
		<>
			<JustifyOption
				checked={selectedPath === "justify"}
				deadline={justificationDeadline}
				disabled={disabled}
				onChange={() => setSelectedPath("justify")}
			/>

			<h2 className="fr-h6 fr-mt-3w fr-mb-0">
				Si la justification n&apos;est pas possible par des critères objectifs
				et non sexistes
			</h2>

			<div className="fr-fieldset__element fr-mt-2w">
				<CompliancePathOption
					checked={selectedPath === "corrective_action"}
					deadline={correctiveActionDeadline}
					disabled={disabled}
					id="path-corrective"
					learnMoreHref="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
					learnMoreLabel="En savoir plus sur actions correctives et seconde déclaration"
					name="compliance-path"
					onChange={() => setSelectedPath("corrective_action")}
					title="Actions correctives et seconde déclaration"
					value="corrective_action"
				>
					<p className="fr-mb-0">
						Vous souhaitez mettre en place des actions correctives, puis
						recalculer et redéclarer l&apos;indicateur par catégorie de salariés
						:
					</p>
					<ul className="fr-mt-1w fr-mb-0">
						<li>
							Mettre en place des actions correctives par accord ou par plan
							d&apos;action
						</li>
						<li>
							Redéclarer l&apos;indicateur dans un délai de 6 mois après votre
							première déclaration
						</li>
						<li>
							Informer et consulter votre CSE sur l&apos;exactitude des données
							et éventuellement, sur la justification des écarts ≥ 5 %
						</li>
						<li>Transmettre l&apos;avis ou les avis du CSE</li>
					</ul>
					<p className="fr-mt-1w fr-mb-0">
						Si des écarts non justifiés persistent, vous devez engager une
						évaluation conjointe des rémunérations.
					</p>
				</CompliancePathOption>
			</div>

			<JointEvaluationOption
				checked={selectedPath === "joint_evaluation"}
				deadline={jointEvaluationDeadline}
				disabled={disabled}
				onChange={() => setSelectedPath("joint_evaluation")}
			/>
		</>
	);
}

import type { ReactNode } from "react";
import type {
	CompliancePathValue,
	ComplianceRound,
	GapJustification,
} from "~/modules/domain";
import { CompliancePathOption } from "./CompliancePathOption";
import styles from "./CompliancePathOption.module.scss";

const LEARN_MORE_HREF =
	"https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle";

export const GAP_JUSTIFICATION_TITLES: Record<GapJustification, string> = {
	all: "Tous les écarts de rémunération ≥ 5 % sont justifiables",
	partial: "Une partie des écarts de rémunération ≥ 5 % est justifiable",
	none: "Aucun écart de rémunération ≥ 5 % n'est justifiable",
};

function Obligations({
	children,
	heading,
}: {
	children: ReactNode;
	heading: ReactNode;
}) {
	return (
		<div className={styles.obligations}>
			<p>{heading}</p>
			<ul>{children}</ul>
		</div>
	);
}

function CseJustificationItems() {
	return (
		<>
			<li>Informer et consulter votre CSE sur la justification des écarts</li>
			<li>Transmettre l&apos;avis du CSE</li>
		</>
	);
}

function PathAlternativeItems() {
	return (
		<>
			<li>Soit effectuer des actions correctives et une seconde déclaration</li>
			<li>Soit mettre en place une évaluation conjointe des rémunérations</li>
		</>
	);
}

function JointEvaluationItems() {
	return (
		<>
			<li>
				Élaborer le rapport de l&apos;évaluation conjointe et le transmettre
			</li>
			<li>
				Mettre en place un accord collectif ou, à défaut, un plan d&apos;action
				contenant des actions correctives
			</li>
		</>
	);
}

function jointEvaluationDeadline(date: Date) {
	return { label: "Échéance de dépôt du rapport", date };
}

const JOINT_EVALUATION_LEARN_MORE = {
	learnMoreHref: LEARN_MORE_HREF,
	learnMoreLabel: "En savoir plus sur l'évaluation conjointe des rémunérations",
	learnMoreTrackingId: "joint_evaluation",
} as const;

type GapJustificationOptionsProps = {
	cseOpinionRequired: boolean;
	disabled?: boolean;
	jointEvaluationDeadline: Date;
	round: ComplianceRound;
	selected: GapJustification | undefined;
	onSelect: (justification: GapJustification) => void;
};

export function GapJustificationOptions({
	cseOpinionRequired,
	disabled,
	jointEvaluationDeadline: jointEvaluationDeadlineDate,
	round,
	selected,
	onSelect,
}: GapJustificationOptionsProps) {
	const isSecondRound = round === 2;
	const unjustifiedDeadline = isSecondRound
		? jointEvaluationDeadline(jointEvaluationDeadlineDate)
		: undefined;
	const unjustifiedLearnMore = isSecondRound
		? JOINT_EVALUATION_LEARN_MORE
		: undefined;

	return (
		<>
			<div className="fr-fieldset__element">
				<CompliancePathOption
					checked={selected === "all"}
					disabled={disabled}
					id="gap-justification-all"
					name="gap-justification"
					onChange={() => onSelect("all")}
					title={GAP_JUSTIFICATION_TITLES.all}
					value="all"
				>
					<p>
						Tous les écarts sont justifiables par des critères objectifs et non
						fondés sur le sexe.
					</p>
					{cseOpinionRequired ? (
						<Obligations
							heading={
								<>
									<strong>Vous devrez</strong>&nbsp;:
								</>
							}
						>
							<CseJustificationItems />
						</Obligations>
					) : (
						<p>
							En l&apos;absence de CSE, aucun avis n&apos;est à transmettre :
							votre démarche est finalisée dès ce choix.
						</p>
					)}
				</CompliancePathOption>
			</div>

			<div className="fr-fieldset__element">
				<CompliancePathOption
					checked={selected === "partial"}
					deadline={unjustifiedDeadline}
					disabled={disabled}
					id="gap-justification-partial"
					name="gap-justification"
					onChange={() => onSelect("partial")}
					title={GAP_JUSTIFICATION_TITLES.partial}
					value="partial"
					{...unjustifiedLearnMore}
				>
					<p>
						Certains écarts sont justifiables par des critères objectifs et non
						fondés sur le sexe.
					</p>
					{cseOpinionRequired && (
						<Obligations
							heading={
								<strong>
									Pour les écarts justifiables, vous devrez&nbsp;:
								</strong>
							}
						>
							<CseJustificationItems />
						</Obligations>
					)}
					{isSecondRound ? (
						<Obligations
							heading={
								<strong>
									Pour les écarts non justifiables, vous devrez&nbsp;:
								</strong>
							}
						>
							<JointEvaluationItems />
						</Obligations>
					) : (
						<Obligations
							heading={
								<strong>
									Pour les écarts non justifiables, vous devrez au choix&nbsp;:
								</strong>
							}
						>
							<PathAlternativeItems />
						</Obligations>
					)}
				</CompliancePathOption>
			</div>

			<div className="fr-fieldset__element">
				<CompliancePathOption
					checked={selected === "none"}
					deadline={unjustifiedDeadline}
					disabled={disabled}
					id="gap-justification-none"
					name="gap-justification"
					onChange={() => onSelect("none")}
					title={GAP_JUSTIFICATION_TITLES.none}
					value="none"
					{...unjustifiedLearnMore}
				>
					<p>
						Aucun des écarts n&apos;est justifiable par des critères objectifs
						et non fondés sur le sexe.
					</p>
					{isSecondRound ? (
						<Obligations
							heading={
								<>
									<strong>Vous devrez</strong>&nbsp;:
								</>
							}
						>
							<JointEvaluationItems />
						</Obligations>
					) : (
						<Obligations
							heading={
								<>
									<strong>Vous devrez au choix</strong>&nbsp;:
								</>
							}
						>
							<PathAlternativeItems />
						</Obligations>
					)}
				</CompliancePathOption>
			</div>
		</>
	);
}

type CompliancePathOptionsProps = {
	correctiveActionDeadline: Date;
	cseOpinionRequired: boolean;
	disabled?: boolean;
	jointEvaluationDeadline: Date;
	paths: readonly CompliancePathValue[];
	selectedPath: CompliancePathValue | undefined;
	onSelect: (path: CompliancePathValue) => void;
};

export function CompliancePathOptions({
	correctiveActionDeadline,
	cseOpinionRequired,
	disabled,
	jointEvaluationDeadline: jointEvaluationDeadlineDate,
	paths,
	selectedPath,
	onSelect,
}: CompliancePathOptionsProps) {
	return (
		<>
			{paths.includes("corrective_action") && (
				<div className="fr-fieldset__element">
					<CompliancePathOption
						checked={selectedPath === "corrective_action"}
						deadline={{
							label: "Échéance de déclaration",
							date: correctiveActionDeadline,
						}}
						disabled={disabled}
						id="path-corrective"
						learnMoreHref={LEARN_MORE_HREF}
						learnMoreLabel="En savoir plus sur les actions correctives et seconde déclaration"
						learnMoreTrackingId="corrective_actions"
						name="compliance-path"
						onChange={() => onSelect("corrective_action")}
						title="Effectuer des actions correctives et une seconde déclaration"
						value="corrective_action"
					>
						<Obligations
							heading={
								<>
									<strong>Vous devrez</strong>&nbsp;:
								</>
							}
						>
							<li>
								Mettre en place des actions correctives par accord ou par plan
								d&apos;action
							</li>
							{cseOpinionRequired && (
								<li>
									Informer et consulter votre CSE sur l&apos;exactitude des
									données et éventuellement, sur la justification des écarts ≥ 5
									%
								</li>
							)}
							<li>
								Redéclarer l&apos;indicateur dans un délai de 6 mois après votre
								première déclaration
							</li>
							{cseOpinionRequired && (
								<li>Transmettre l&apos;avis ou les avis du CSE</li>
							)}
						</Obligations>
						<p>
							Si des écarts non justifiés persistent à l&apos;issue de la
							seconde déclaration, vous devrez engager une évaluation conjointe
							des rémunérations.
						</p>
					</CompliancePathOption>
				</div>
			)}

			{paths.includes("joint_evaluation") && (
				<div className="fr-fieldset__element">
					<CompliancePathOption
						checked={selectedPath === "joint_evaluation"}
						deadline={jointEvaluationDeadline(jointEvaluationDeadlineDate)}
						disabled={disabled}
						id="path-joint"
						name="compliance-path"
						onChange={() => onSelect("joint_evaluation")}
						title="Mettre en place une évaluation conjointe des rémunérations"
						value="joint_evaluation"
						{...JOINT_EVALUATION_LEARN_MORE}
					>
						<Obligations
							heading={
								<>
									<strong>Vous devrez</strong>&nbsp;:
								</>
							}
						>
							<JointEvaluationItems />
						</Obligations>
					</CompliancePathOption>
				</div>
			)}
		</>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { saveCompliancePathSchema } from "~/modules/declaration-remuneration/schemas";
import type { CampaignDeadlines } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import common from "../shared/common.module.scss";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { CompliancePathOption } from "./compliancePath/CompliancePathOption";
import type { CompliancePathValue } from "./compliancePath/constants";
import { DeclarationSuccessBanner } from "./compliancePath/DeclarationSuccessBanner";

type Props = {
	campaignDeadlines: CampaignDeadlines;
	currentYear: number;
	email: string;
	hasCse: boolean | null;
	initialPath?: CompliancePathValue;
	isSecondRound?: boolean;
	pdfDownloadHref?: string;
};

function JointEvaluationOption({
	checked,
	deadline,
	onChange,
}: {
	checked: boolean;
	deadline: Date;
	onChange: () => void;
}) {
	return (
		<div className="fr-fieldset__element">
			<CompliancePathOption
				checked={checked}
				deadline={deadline}
				id="path-joint"
				learnMoreHref="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
				learnMoreLabel="En savoir plus sur évaluation conjointe des rémunérations"
				name="compliance-path"
				onChange={onChange}
				title="Évaluation conjointe des rémunérations"
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

function JustifyOption({
	checked,
	deadline,
	onChange,
}: {
	checked: boolean;
	deadline: Date;
	onChange: () => void;
}) {
	return (
		<div className="fr-fieldset__element">
			<CompliancePathOption
				checked={checked}
				deadline={deadline}
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

function SecondRoundOptions({
	justificationDeadline,
	jointEvaluationDeadline,
	selectedPath,
	setSelectedPath,
}: {
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
				onChange={() => setSelectedPath("justify")}
			/>
			<JointEvaluationOption
				checked={selectedPath === "joint_evaluation"}
				deadline={jointEvaluationDeadline}
				onChange={() => setSelectedPath("joint_evaluation")}
			/>
		</>
	);
}

function FirstRoundOptions({
	correctiveActionDeadline,
	jointEvaluationDeadline,
	justificationDeadline,
	selectedPath,
	setSelectedPath,
}: {
	correctiveActionDeadline: Date;
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
				onChange={() => setSelectedPath("justify")}
			/>

			<h3 className="fr-h6 fr-mt-3w fr-mb-0">
				Si la justification n&apos;est pas possible par des critères objectifs
				et non sexistes
			</h3>

			<div className="fr-fieldset__element fr-mt-2w">
				<CompliancePathOption
					checked={selectedPath === "corrective_action"}
					deadline={correctiveActionDeadline}
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
				onChange={() => setSelectedPath("joint_evaluation")}
			/>
		</>
	);
}

export function CompliancePathChoice({
	campaignDeadlines,
	currentYear,
	email,
	hasCse,
	initialPath,
	isSecondRound = false,
	pdfDownloadHref,
}: Props) {
	const router = useRouter();

	const form = useZodForm(saveCompliancePathSchema, {
		defaultValues: { path: initialPath },
	});

	const selectedPath = form.watch("path");

	const mutation = api.declaration.saveCompliancePath.useMutation({
		onSuccess: (_, { path }) => {
			if (path === "corrective_action") {
				router.push("/declaration-remuneration/parcours-conformite/etape/1");
			} else if (path === "joint_evaluation") {
				router.push(
					"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
				);
			} else {
				router.push("/avis-cse");
			}
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		if (!data.path) return;
		mutation.mutate({ path: data.path });
	});

	return (
		<form className={common.flexColumnGap2} onSubmit={onSubmit}>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Déclaration des indicateurs de rémunération {currentYear}
				</h1>
				<SavedIndicator />
			</div>

			<DeclarationSuccessBanner
				email={email}
				isSecondDeclaration={isSecondRound}
				modificationDeadline={
					isSecondRound
						? campaignDeadlines.decl2ModificationDeadline
						: campaignDeadlines.decl1ModificationDeadline
				}
				pdfDownloadHref={pdfDownloadHref}
			/>

			<h2 className="fr-h4 fr-mb-0">
				Parcours de mise en conformité pour l&apos;indicateur par catégorie de
				salariés
			</h2>

			<p className="fr-mb-0">
				Des écarts ≥ 5 % ont été constatés,{" "}
				<span className="fr-text--medium">
					vous devez engager l&apos;un des parcours suivants.
				</span>
			</p>

			<div className={common.flexColumnGap1}>
				<h3 className="fr-h6 fr-mb-0">
					La justification est possible par des critères objectifs et non
					sexistes
				</h3>
				<p className="fr-mb-0">
					<a
						className="fr-link"
						href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
						rel="noopener noreferrer"
						target="_blank"
					>
						Qu&apos;entend-on par critères objectifs et non sexistes ?
						<NewTabNotice />
					</a>
				</p>
			</div>

			<Controller
				control={form.control}
				name="path"
				render={({ field }) => (
					<fieldset
						aria-labelledby="compliance-path-legend"
						className="fr-fieldset"
					>
						<legend className="fr-sr-only" id="compliance-path-legend">
							Choix du parcours de mise en conformité
						</legend>

						{isSecondRound ? (
							<SecondRoundOptions
								jointEvaluationDeadline={
									campaignDeadlines.decl2JointEvaluationDeadline
								}
								justificationDeadline={
									campaignDeadlines.decl2JustificationDeadline
								}
								selectedPath={field.value}
								setSelectedPath={field.onChange}
							/>
						) : (
							<FirstRoundOptions
								correctiveActionDeadline={
									campaignDeadlines.decl2ModificationDeadline
								}
								jointEvaluationDeadline={
									campaignDeadlines.decl1JointEvaluationDeadline
								}
								justificationDeadline={
									campaignDeadlines.decl1JustificationDeadline
								}
								selectedPath={field.value}
								setSelectedPath={field.onChange}
							/>
						)}
					</fieldset>
				)}
			/>

			<FormActions
				isSubmitting={mutation.isPending}
				nextDisabled={!selectedPath}
				nextLabel="Suivant"
				previousHref="/declaration-remuneration/etape/6"
			/>
		</form>
	);
}

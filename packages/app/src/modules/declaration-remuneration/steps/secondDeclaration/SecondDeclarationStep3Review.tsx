"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { getPostComplianceDestination } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { api } from "~/trpc/react";
import stepStyles from "../Step6Review.module.scss";
import { CardTitle } from "../step6/CardTitle";
import { GapColumn } from "../step6/GapColumn";
import { parseEmployeeCategories } from "../step6/parseStep5Categories";
import { BASE_PATH } from "./constants";
import { NextStepsSection } from "./NextStepsSection";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";

type Props = {
	hasCse: boolean | null;
	secondDeclarationCategories: EmployeeCategoryRow[];
};

export function SecondDeclarationStep3Review({
	hasCse,
	secondDeclarationCategories,
}: Props) {
	const router = useRouter();
	const [certified, setCertified] = useState(false);

	const parsed = parseEmployeeCategories(secondDeclarationCategories);
	const gapsExist = parsed.some(
		(cat) =>
			(cat.annualBaseGap !== null && cat.annualBaseGap >= 5) ||
			(cat.annualVariableGap !== null && cat.annualVariableGap >= 5) ||
			(cat.hourlyBaseGap !== null && cat.hourlyBaseGap >= 5) ||
			(cat.hourlyVariableGap !== null && cat.hourlyVariableGap >= 5),
	);

	const mutation = api.declaration.submitSecondDeclaration.useMutation({
		onSuccess: () => {
			if (gapsExist) {
				router.push(COMPLIANCE_PATH);
			} else {
				router.push(getPostComplianceDestination(hasCse));
			}
		},
	});

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!certified) return;
		mutation.mutate();
	}

	return (
		<form className={common.flexColumnGap2} onSubmit={handleSubmit}>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégorie de
					salariés
				</h1>
				<SavedIndicator />
			</div>

			<SecondDeclarationStepIndicator currentStep={3} />

			<p className={`fr-mb-0 ${common.mentionGrey}`}>
				Vérifiez que toutes les informations ont été complétées avant de
				soumettre votre seconde déclaration des écarts de rémunération par
				catégorie de salariés aux services du ministère chargé du travail.
			</p>

			<h2 className="fr-h5 fr-mb-0">Indicateurs par catégorie de salariés</h2>

			<div className={stepStyles.card}>
				<CardTitle tooltipId="tooltip-second-decl-categories">
					Écart de rémunération par catégories de salariés (salaire de base et
					primes)
				</CardTitle>
				{parsed.length > 0 ? (
					parsed.map((cat) => (
						<div key={cat.index}>
							<p className="fr-text--bold fr-mb-0">
								[Catégorie d&apos;emplois n°{cat.index + 1}]
							</p>
							<div className={stepStyles.sideBySide}>
								<GapColumn
									columns={[
										{ label: "Salaire de base", gap: cat.annualBaseGap },
										{
											label: "Composantes variables ou complémentaires",
											gap: cat.annualVariableGap,
										},
									]}
									title="Annuelle brute"
								/>
								<div className={stepStyles.verticalSeparator} />
								<GapColumn
									columns={[
										{ label: "Salaire de base", gap: cat.hourlyBaseGap },
										{
											label: "Composantes variables ou complémentaires",
											gap: cat.hourlyVariableGap,
										},
									]}
									title="Horaire brute"
								/>
							</div>
						</div>
					))
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			<NextStepsSection hasGapsAboveThreshold={gapsExist} />

			<div className="fr-checkbox-group">
				<input
					checked={certified}
					id="certification-checkbox"
					onChange={(e) => setCertified(e.target.checked)}
					type="checkbox"
				/>
				<label className="fr-label" htmlFor="certification-checkbox">
					Je certifie que les données saisies sont exactes et conformes aux
					informations disponibles dans les systèmes de paie et de gestion des
					ressources humaines de l&apos;entreprise.
				</label>
			</div>

			<FormActions
				isSubmitting={mutation.isPending}
				nextDisabled={!certified}
				nextLabel="Soumettre"
				previousHref={`${BASE_PATH}/etape/2`}
			/>
		</form>
	);
}

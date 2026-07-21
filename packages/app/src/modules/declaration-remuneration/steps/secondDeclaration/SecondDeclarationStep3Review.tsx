"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { getPostComplianceDestination } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { NextStepsBox } from "~/modules/declaration-remuneration/shared/NextStepsBox";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { SubmitDeclarationModal } from "~/modules/declaration-remuneration/shared/SubmitDeclarationModal";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { hasHighGap } from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import stepStyles from "../Step6Review.module.scss";
import { CardTitle } from "../step6/CardTitle";
import { GapBadge } from "../step6/GapBadge";
import { parseEmployeeCategories } from "../step6/parseStep5Categories";
import { BASE_PATH } from "./constants";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

type Props = {
	cseApplicable: boolean;
	declarationYear: number;
	hasCse: boolean | null;
	secondDeclarationCategories: EmployeeCategoryRow[];
	siren: string;
};

export function SecondDeclarationStep3Review({
	cseApplicable,
	declarationYear,
	hasCse,
	secondDeclarationCategories,
	siren,
}: Props) {
	const router = useRouter();
	const modalRef = useRef<HTMLDialogElement>(null);

	const parsed = parseEmployeeCategories(secondDeclarationCategories);
	const gapsExist = parsed.some((cat) =>
		hasHighGap([
			cat.annualBaseGap,
			cat.annualVariableGap,
			cat.hourlyBaseGap,
			cat.hourlyVariableGap,
		]),
	);

	const mutation = api.declaration.submitSecondDeclaration.useMutation({
		onSuccess: () => {
			if (gapsExist) {
				router.push(BASE_PATH);
			} else {
				router.push(getPostComplianceDestination(hasCse));
			}
		},
	});

	const openModal = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.disclose();
		}
	}, []);

	const closeModal = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.conceal();
		}
	}, []);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		openModal();
	}

	return (
		<form
			autoComplete="off"
			className={common.flexColumnGap2}
			onSubmit={handleSubmit}
		>
			<div className={common.flexBetween}>
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur
					par&nbsp;catégorie de salariés
				</h1>
				<SavedIndicator hasData={true} />
			</div>

			<SecondDeclarationStepIndicator currentStep={3} />

			<p className={`fr-mb-0 ${stepStyles.intro}`}>
				Vérifiez que toutes les informations ont été complétées avant de
				soumettre votre seconde déclaration des écarts de rémunération par
				catégorie de salariés aux services du ministère chargé du travail.
			</p>

			<h2 className="fr-h5 fr-mb-0">Indicateurs par catégorie de salariés</h2>

			<div className={stepStyles.card}>
				<CardTitle tooltipId="tooltip-second-decl-categories">
					Écart de rémunération par catégories de salariés
				</CardTitle>
				{parsed.length > 0 ? (
					parsed.map((cat) => (
						<div key={cat.index}>
							<p className="fr-text--sm fr-text--bold fr-mb-0">
								Catégorie d&apos;emplois n°{cat.index + 1} : {cat.name}
							</p>
							<div className={stepStyles.sideBySide}>
								<div className={stepStyles.column}>
									<p className="fr-text--bold fr-text--sm fr-mb-0">
										Annuelle brute
									</p>
									<div className={stepStyles.gapGrid}>
										<p className="fr-text--sm fr-mb-0">Salaire de base</p>
										<p className="fr-text--sm fr-mb-0">
											Composantes variables ou complémentaires
										</p>
										<GapBadge gap={cat.annualBaseGap} />
										<GapBadge gap={cat.annualVariableGap} />
									</div>
								</div>
								<div className={stepStyles.verticalSeparator} />
								<div className={stepStyles.column}>
									<p className="fr-text--bold fr-text--sm fr-mb-0">
										Horaire brute
									</p>
									<div className={stepStyles.gapGrid}>
										<p className="fr-text--sm fr-mb-0">Salaire de base</p>
										<p className="fr-text--sm fr-mb-0">
											Composantes variables ou complémentaires
										</p>
										<GapBadge gap={cat.hourlyBaseGap} />
										<GapBadge gap={cat.hourlyVariableGap} />
									</div>
								</div>
							</div>
						</div>
					))
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			<NextStepsBox
				cseApplicable={cseApplicable}
				hasGapsAboveThreshold={gapsExist}
				isSecondDeclaration
				siren={siren}
			/>

			<FormActions
				nextLabel="Soumettre"
				previousHref={`${BASE_PATH}/etape/2`}
			/>

			<SubmitDeclarationModal
				isPending={mutation.isPending}
				isSecondDeclaration
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={() => mutation.mutate()}
				year={declarationYear}
			/>
		</form>
	);
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { DownloadDeclarationPdfButton } from "~/modules/declarationPdf";
import {
	computeGap,
	GAP_ALERT_THRESHOLD,
	getCurrentYear,
} from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { QUARTILE_NAMES } from "../shared/constants";
import { FormActions } from "../shared/FormActions";
import { NextStepsBox } from "../shared/NextStepsBox";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { SubmitDeclarationModal } from "../shared/SubmitDeclarationModal";
import type {
	EmployeeCategoryRow,
	Step2Data,
	Step3Data,
	Step4Data,
} from "../types";
import stepStyles from "./Step6Review.module.scss";
import { CardTitle } from "./step6/CardTitle";
import { GapColumn } from "./step6/GapColumn";
import { GapSideBySide } from "./step6/GapSideBySide";
import { parseEmployeeCategories } from "./step6/parseStep5Categories";
import { QuartileColumn } from "./step6/QuartileColumn";

/** Check if any gap value is >= the regulatory threshold */
function hasAnyHighGap(gaps: (number | null)[]): boolean {
	return gaps.some((g) => g !== null && Math.abs(g) >= GAP_ALERT_THRESHOLD);
}

type Props = {
	declaration: {
		siren: string;
		totalWomen: number | null;
		totalMen: number | null;
		status: string | null;
	};
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories?: EmployeeCategoryRow[];
	isSubmitted?: boolean;
};

export function Step6Review({
	declaration,
	step2Data,
	step3Data,
	step4Data,
	step5Categories = [],
	isSubmitted = false,
}: Props) {
	const currentYear = getCurrentYear();
	const router = useRouter();
	const modalRef = useRef<HTMLDialogElement>(null);
	const submitMutation = api.declaration.submit.useMutation({
		onSuccess: () => {
			router.push("/declaration-remuneration/parcours-conformite");
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

	// Step 2 gaps
	const annualMeanGap = computeGap(
		step2Data.indicatorAAnnualWomen,
		step2Data.indicatorAAnnualMen,
	);
	const hourlyMeanGap = computeGap(
		step2Data.indicatorAHourlyWomen,
		step2Data.indicatorAHourlyMen,
	);
	const annualMedianGap = computeGap(
		step2Data.indicatorCAnnualWomen,
		step2Data.indicatorCAnnualMen,
	);
	const hourlyMedianGap = computeGap(
		step2Data.indicatorCHourlyWomen,
		step2Data.indicatorCHourlyMen,
	);

	const hasStep2Data = Object.values(step2Data).some((v) => v !== "");

	// Step 3 gaps
	const step3AnnualMeanGap = computeGap(
		step3Data.indicatorBAnnualWomen,
		step3Data.indicatorBAnnualMen,
	);
	const step3HourlyMeanGap = computeGap(
		step3Data.indicatorBHourlyWomen,
		step3Data.indicatorBHourlyMen,
	);
	const step3AnnualMedianGap = computeGap(
		step3Data.indicatorDAnnualWomen,
		step3Data.indicatorDAnnualMen,
	);
	const step3HourlyMedianGap = computeGap(
		step3Data.indicatorDHourlyWomen,
		step3Data.indicatorDHourlyMen,
	);

	const hasStep3Data = Object.values(step3Data).some((v) => v !== "");

	// Step 4 quartile data
	const hasStep4Data =
		step4Data.annual.some((q) => q.threshold || q.women !== undefined) ||
		step4Data.hourly.some((q) => q.threshold || q.women !== undefined);

	// Step 5 categories
	const step5Parsed = parseEmployeeCategories(step5Categories);

	// Check if any gap exceeds the regulatory threshold
	const allGaps = [
		annualMeanGap,
		hourlyMeanGap,
		annualMedianGap,
		hourlyMedianGap,
		step3AnnualMeanGap,
		step3AnnualMedianGap,
		step3HourlyMeanGap,
		step3HourlyMedianGap,
		...step5Parsed.flatMap((cat) => [
			cat.annualBaseGap,
			cat.annualVariableGap,
			cat.hourlyBaseGap,
			cat.hourlyVariableGap,
		]),
	];
	const highGap = hasAnyHighGap(allGaps);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!isSubmitted) {
			openModal();
		}
	}

	return (
		<form className={stepStyles.formColumn} onSubmit={handleSubmit}>
			{/* Title + save status */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				</div>
				<div className="fr-col-auto">
					<SavedIndicator />
				</div>
			</div>

			<StepIndicator currentStep={6} />

			<p className="fr-mb-0">
				Vérifiez que toutes les informations ont été complétées avant de
				soumettre votre déclaration aux services du ministère chargé du travail.
			</p>

			{/* Section: Indicators for all employees */}
			<h2 className="fr-h6 fr-mb-0">
				Indicateurs pour l&apos;ensemble de vos salariés
			</h2>

			<div className={stepStyles.section}>
				{/* Card 1: Pay gap (Step 2) */}
				<div className={stepStyles.card}>
					<CardTitle>Écart de rémunération</CardTitle>
					{hasStep2Data ? (
						<GapSideBySide
							annualMeanGap={annualMeanGap}
							annualMedianGap={annualMedianGap}
							hourlyMeanGap={hourlyMeanGap}
							hourlyMedianGap={hourlyMedianGap}
						/>
					) : (
						<p className={`fr-mb-0 ${common.mentionGrey}`}>
							Aucune donnée renseignée.
						</p>
					)}
				</div>

				{/* Card 2: Variable pay (Step 3) */}
				<div className={stepStyles.card}>
					<CardTitle>
						Écart de rémunération variable ou complémentaire
					</CardTitle>
					{hasStep3Data ? (
						<>
							<GapSideBySide
								annualMeanGap={step3AnnualMeanGap}
								annualMedianGap={step3AnnualMedianGap}
								hourlyMeanGap={step3HourlyMeanGap}
								hourlyMedianGap={step3HourlyMedianGap}
							/>
							<div className={stepStyles.sideBySide}>
								<div className={stepStyles.column}>
									<p className="fr-text--bold fr-text--sm fr-mb-0">
										Proportion
									</p>
									<div className={stepStyles.subSection}>
										<div className={stepStyles.flex1}>
											<p
												className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}
											>
												Femmes
											</p>
											<strong>
												{step3Data.indicatorEWomen
													? `${step3Data.indicatorEWomen} %`
													: "-"}
											</strong>
										</div>
										<div className={stepStyles.flex1}>
											<p
												className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}
											>
												Hommes
											</p>
											<strong>
												{step3Data.indicatorEMen
													? `${step3Data.indicatorEMen} %`
													: "-"}
											</strong>
										</div>
									</div>
								</div>
								<div className={stepStyles.verticalSeparator} />
								<div className={stepStyles.column} />
							</div>
						</>
					) : (
						<p className={`fr-mb-0 ${common.mentionGrey}`}>
							Aucune donnée renseignée.
						</p>
					)}
				</div>

				{/* Card 3: Quartile distribution (Step 4) */}
				<div className={stepStyles.card}>
					<CardTitle tooltipId="tooltip-quartile">
						Proportion de femmes et d&apos;hommes dans chaque quartile salarial
					</CardTitle>
					{hasStep4Data ? (
						<>
							<QuartileColumn
								quartiles={step4Data.annual.map((q, i) => ({
									label: QUARTILE_NAMES[i] ?? "",
									womenCount: q.women ?? 0,
									menCount: q.men ?? 0,
								}))}
								title="Rémunération annuelle brute moyenne"
							/>
							<QuartileColumn
								quartiles={step4Data.hourly.map((q, i) => ({
									label: QUARTILE_NAMES[i] ?? "",
									womenCount: q.women ?? 0,
									menCount: q.men ?? 0,
								}))}
								title="Rémunération horaire brute moyenne"
							/>
						</>
					) : (
						<p className={`fr-mb-0 ${common.mentionGrey}`}>
							Aucune donnée renseignée.
						</p>
					)}
				</div>
			</div>

			{/* Section: Indicators by employee category */}
			<h2 className="fr-h6 fr-mb-0">Indicateurs par catégorie de salariés</h2>

			{/* Card 4: Employee categories (Step 5) */}
			<div className={stepStyles.card}>
				<CardTitle tooltipId="tooltip-categories">
					Écart de rémunération par catégories de salariés
				</CardTitle>
				{step5Parsed.length > 0 ? (
					step5Parsed.map((cat) => (
						<div key={cat.index}>
							<p className="fr-text--bold fr-mb-0">{cat.name}</p>
							<div className={stepStyles.sideBySide}>
								<GapColumn
									columns={[
										{ label: "Salaire de base", gap: cat.annualBaseGap },
										{
											label: "Composantes variables",
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
											label: "Composantes variables",
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

			{isSubmitted && <DownloadDeclarationPdfButton />}

			{/* Next steps callout when high gap detected */}
			{highGap && declaration.siren && (
				<NextStepsBox
					hasGapsAboveThreshold={highGap}
					siren={declaration.siren}
				/>
			)}

			{isSubmitted ? (
				<FormActions
					nextHref="/declaration-remuneration/parcours-conformite"
					nextLabel="Suivant"
					previousHref="/"
				/>
			) : (
				<FormActions
					nextLabel="Suivant"
					previousHref="/declaration-remuneration/etape/5"
				/>
			)}

			<Link className={`fr-link ${stepStyles.centeredLink}`} href="/avis-cse">
				Modèles d&apos;avis CSE
			</Link>

			{!isSubmitted && (
				<SubmitDeclarationModal
					isPending={submitMutation.isPending}
					modalRef={modalRef}
					onClose={closeModal}
					onSubmit={() => submitMutation.mutate()}
					year={currentYear}
				/>
			)}
		</form>
	);
}

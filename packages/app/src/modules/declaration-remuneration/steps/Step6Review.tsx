"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { computeGap, GAP_ALERT_THRESHOLD } from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
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
import { IndicatorSections } from "./step6/IndicatorSections";
import { parseEmployeeCategories } from "./step6/parseStep5Categories";

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
	declarationYear: number;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories?: EmployeeCategoryRow[];
	isSubmitted?: boolean;
};

export function Step6Review({
	declaration,
	declarationYear,
	step2Data,
	step3Data,
	step4Data,
	step5Categories = [],
	isSubmitted = false,
}: Props) {
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

	// Step 5 categories — parsed here to feed `allGaps` below; the cards
	// re-parse internally inside IndicatorSections (negligible cost).
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
						Déclaration des indicateurs de rémunération {declarationYear}
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

			<IndicatorSections
				step2Data={step2Data}
				step3Data={step3Data}
				step4Data={step4Data}
				step5Categories={step5Categories}
				withTooltips
			/>

			{/* Next steps callout when high gap detected */}
			{highGap && declaration.siren && (
				<NextStepsBox
					hasGapsAboveThreshold={highGap}
					siren={declaration.siren}
				/>
			)}

			<FormActions
				nextHref={
					isSubmitted
						? "/declaration-remuneration/parcours-conformite"
						: undefined
				}
				nextLabel="Suivant"
				previousHref="/declaration-remuneration/etape/5"
			/>

			{!isSubmitted && (
				<SubmitDeclarationModal
					isPending={submitMutation.isPending}
					modalRef={modalRef}
					onClose={closeModal}
					onSubmit={() => submitMutation.mutate()}
					year={declarationYear}
				/>
			)}
		</form>
	);
}

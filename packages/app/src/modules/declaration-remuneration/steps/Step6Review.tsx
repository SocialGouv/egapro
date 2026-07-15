"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { trackFunnelComplete } from "~/modules/analytics";
import { computeGap, getCompanySizeRange, hasHighGap } from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { getCurrentStageHref } from "../shared/complianceNavigation";
import { FormActions } from "../shared/FormActions";
import {
	DECLARATION_FUNNEL,
	declarationFunnelDimensions,
} from "../shared/funnelConfig";
import { useLockContext } from "../shared/lock/LockContext";
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

type Props = {
	declaration: {
		siren: string;
		status: string | null;
	};
	// Official GIP/DSN workforce — canonical source for the Matomo size bucket
	// (see StepPageClient), kept consistent with all business decisions.
	companyWorkforce: number | null;
	declarationYear: number;
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step5Categories?: EmployeeCategoryRow[];
	totalWomen?: number;
	totalMen?: number;
	isSubmitted?: boolean;
	hasCse?: boolean | null;
};

export function Step6Review({
	declaration,
	companyWorkforce,
	declarationYear,
	step2Data,
	step3Data,
	step4Data,
	step5Categories = [],
	totalWomen,
	totalMen,
	isSubmitted = false,
	hasCse = null,
}: Props) {
	const router = useRouter();
	const { isReadOnly } = useLockContext();
	const modalRef = useRef<HTMLDialogElement>(null);
	const submitMutation = api.declaration.submit.useMutation({
		onSuccess: () => {
			trackFunnelComplete(
				DECLARATION_FUNNEL,
				declarationFunnelDimensions(
					declarationYear,
					companyWorkforce !== null
						? getCompanySizeRange(companyWorkforce)
						: undefined,
				),
			);
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
	const highGap = hasHighGap(allGaps);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!isSubmitted) {
			openModal();
		}
	}

	return (
		<form
			autoComplete="off"
			className={stepStyles.formColumn}
			onSubmit={handleSubmit}
		>
			{/* Native `disabled` is kept on purpose: it is the only mechanism
			    enforcing the read-only mode, and disabled fields remain exposed
			    to screen readers (#3803). */}
			<fieldset className={common.readOnlyFieldset} disabled={isReadOnly}>
				<legend className="fr-sr-only">Récapitulatif de la déclaration</legend>
				<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Déclaration des indicateurs de rémunération {declarationYear}
						</h1>
					</div>
					<div className="fr-col-auto">
						<SavedIndicator hasData={true} />
					</div>
				</div>

				<StepIndicator currentStep={6} />

				<p className={`fr-mb-0 ${stepStyles.intro}`}>
					Vérifiez que toutes les informations ont été complétées avant de
					soumettre votre déclaration aux services du ministère chargé du
					travail.
				</p>

				<IndicatorSections
					step2Data={step2Data}
					step3Data={step3Data}
					step4Data={step4Data}
					step5Categories={step5Categories}
					totalMen={totalMen}
					totalWomen={totalWomen}
					withTooltips
				/>

				{highGap && declaration.siren && (
					<NextStepsBox
						hasGapsAboveThreshold={highGap}
						siren={declaration.siren}
					/>
				)}

				<FormActions
					nextHref={
						isSubmitted
							? getCurrentStageHref(declaration.status, hasCse)
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
			</fieldset>
		</form>
	);
}

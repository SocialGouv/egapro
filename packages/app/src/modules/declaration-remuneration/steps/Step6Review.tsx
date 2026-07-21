"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { trackFunnelComplete } from "~/modules/analytics";
import type { DeclarationFsmStatus } from "~/modules/domain";
import {
	computeGap,
	getCompanySizeRange,
	getObligationWorkforce,
	isComplianceProcessRequired,
	isCseRequired,
} from "~/modules/domain";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { getCurrentStageHref } from "../shared/complianceNavigation";
import { FormActions } from "../shared/FormActions";
import {
	DECLARATION_FUNNEL,
	declarationFunnelDimensions,
} from "../shared/funnelConfig";
import { getPreviousStepHref } from "../shared/funnelSteps";
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

type Props = {
	declaration: {
		siren: string;
		status: DeclarationFsmStatus | null;
	};
	// Official GIP/DSN workforce — canonical source for the Matomo size bucket
	// (see StepPageClient), kept consistent with all business decisions.
	companyWorkforce: number | null;
	declarationYear: number;
	indicatorGRequired: boolean;
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
	indicatorGRequired,
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
	const modalRef = useRef<HTMLDialogElement>(null);
	const cseApplicable = isCseRequired(getObligationWorkforce(companyWorkforce));
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

	// Phase 2 gate — domain single source of truth, same rule as the exports/public API.
	const complianceProcessRequired = isComplianceProcessRequired({
		workforce: companyWorkforce,
		hasIndicatorG: indicatorGRequired,
		gap: computeGap(
			step2Data.indicatorAAnnualWomen,
			step2Data.indicatorAAnnualMen,
		),
	});

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
			{/* Read-only mode is enforced per control (the submit button reads the
			    lock context): a fieldset-level `disabled` would hide the content
			    from some assistive technologies (#3803). */}
			<fieldset className={common.readOnlyFieldset}>
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

				<StepIndicator
					currentStep={6}
					indicatorGRequired={indicatorGRequired}
				/>

				<div className={stepStyles.recapBody}>
					<p className={`fr-mb-0 ${stepStyles.intro}`}>
						Vérifiez que toutes les informations ont été complétées avant de
						soumettre votre déclaration aux services du ministère chargé du
						travail.
					</p>

					<IndicatorSections
						indicatorGRequired={indicatorGRequired}
						step2Data={step2Data}
						step3Data={step3Data}
						step4Data={step4Data}
						step5Categories={step5Categories}
						totalMen={totalMen}
						totalWomen={totalWomen}
						withTooltips
					/>

					{complianceProcessRequired && declaration.siren && (
						<NextStepsBox
							cseApplicable={cseApplicable}
							hasGapsAboveThreshold={complianceProcessRequired}
							siren={declaration.siren}
						/>
					)}
				</div>

				<FormActions
					nextHref={
						isSubmitted
							? getCurrentStageHref(declaration.status, hasCse)
							: undefined
					}
					nextLabel="Suivant"
					previousHref={getPreviousStepHref(6, indicatorGRequired)}
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

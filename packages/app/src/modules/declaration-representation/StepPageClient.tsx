"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isRepresentationPublicationRequired } from "~/modules/domain";
import { Stepper } from "./Stepper";
import type { StepValidator } from "./shared/draft/DraftContext";
import { RepresentationDraftProvider } from "./shared/draft/DraftContext";
import { useRepresentationDraft } from "./shared/draft/useRepresentationDraft";
import {
	getNextStep,
	getNextStepHref,
	getPreviousStepHref,
	getStepDefinition,
	PUBLICATION_STEP_NUMBER,
	stepHref,
} from "./steps";
import type { RepresentationDraft } from "./types";

type StepPageClientProps = {
	step: number;
	year: number;
	campaignYear: number;
	initialDraft: RepresentationDraft;
	campaignOpen: boolean;
};

function isPublicationStepRequired(draft: RepresentationDraft): boolean {
	if (
		draft.executivesCount === undefined ||
		draft.hasManagementBody === undefined
	) {
		return true;
	}
	return isRepresentationPublicationRequired(
		draft.executivesCount,
		draft.hasManagementBody,
	);
}

export function StepPageClient({
	step,
	year,
	campaignYear,
	initialDraft,
	campaignOpen,
}: StepPageClientProps) {
	const router = useRouter();
	const [navigationError, setNavigationError] = useState<string | null>(null);
	const [isAdvancing, setIsAdvancing] = useState(false);

	const { draft, setDraftValues, saveProgress, isSaving, isPendingSave } =
		useRepresentationDraft({
			year,
			step,
			initialDraft,
			enabled: campaignOpen,
		});

	const stepValidatorRef = useRef<StepValidator | null>(null);
	const registerStepValidator = useCallback(
		(validator: StepValidator | null) => {
			stepValidatorRef.current = validator;
		},
		[],
	);

	const skipPublicationStep = !isPublicationStepRequired(draft);
	const definition = getStepDefinition(step);
	const previousHref = getPreviousStepHref(step, skipPublicationStep);
	const nextHref = getNextStepHref(step, skipPublicationStep);
	const bypassHref = getNextStepHref(PUBLICATION_STEP_NUMBER - 1, true);
	const mustBypassPublicationStep =
		step === PUBLICATION_STEP_NUMBER && skipPublicationStep;

	useEffect(() => {
		if (mustBypassPublicationStep && bypassHref !== undefined) {
			router.replace(bypassHref);
		}
	}, [mustBypassPublicationStep, bypassHref, router]);

	if (definition === undefined) return null;
	if (mustBypassPublicationStep) return null;

	const StepComponent = definition.Component;

	async function handleNext() {
		const nextStep = getNextStep(step, skipPublicationStep);
		if (nextStep === undefined) return;
		if (stepValidatorRef.current) {
			const isValid = await stepValidatorRef.current();
			if (!isValid) return;
		}
		setNavigationError(null);
		setIsAdvancing(true);
		try {
			await saveProgress(nextStep);
			router.push(stepHref(nextStep));
		} catch {
			setNavigationError(
				"L'enregistrement de votre progression a échoué. Veuillez réessayer.",
			);
		} finally {
			setIsAdvancing(false);
		}
	}

	return (
		<RepresentationDraftProvider
			value={{
				year,
				step,
				draft,
				setDraftValues,
				isSaving,
				isPendingSave,
				isReadOnly: !campaignOpen,
				registerStepValidator,
			}}
		>
			<h1 className="fr-h4">
				Démarche des indicateurs de représentation {campaignYear}
			</h1>

			{campaignOpen ? null : (
				<div className="fr-alert fr-alert--info fr-mb-4w">
					<h2 className="fr-alert__title">
						La campagne de représentation équilibrée est close
					</h2>
					<p>
						Votre déclaration est consultable en lecture seule : elle ne peut
						plus être modifiée.
					</p>
				</div>
			)}

			<Stepper currentStep={step} />

			<StepComponent />

			{navigationError ? (
				<div
					className="fr-alert fr-alert--error fr-alert--sm fr-mt-4w"
					role="alert"
				>
					<p>{navigationError}</p>
				</div>
			) : null}

			<div className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-6w">
				<Link
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					href={previousHref}
				>
					Précédent
				</Link>
				{nextHref !== undefined && campaignOpen ? (
					<button
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						disabled={isAdvancing}
						onClick={handleNext}
						type="button"
					>
						{isAdvancing ? "Enregistrement…" : "Suivant"}
					</button>
				) : null}
			</div>
		</RepresentationDraftProvider>
	);
}

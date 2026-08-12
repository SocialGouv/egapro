"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Stepper } from "./Stepper";
import { RepresentationDraftProvider } from "./shared/draft/DraftContext";
import { useRepresentationDraft } from "./shared/draft/useRepresentationDraft";
import {
	getNextStepHref,
	getPreviousStepHref,
	getStepDefinition,
} from "./steps";
import type { RepresentationDraft } from "./types";

type StepPageClientProps = {
	step: number;
	year: number;
	campaignYear: number;
	initialDraft: RepresentationDraft;
	campaignOpen: boolean;
};

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
	const [stepValid, setStepValid] = useState(true);
	const previousStepRef = useRef(step);

	const { draft, setDraftValues, saveProgress, isSaving, isPendingSave } =
		useRepresentationDraft({
			year,
			step,
			initialDraft,
			enabled: campaignOpen,
		});

	useEffect(() => {
		if (previousStepRef.current === step) return;
		previousStepRef.current = step;
		setStepValid(true);
	}, [step]);

	const definition = getStepDefinition(step);
	const previousHref = getPreviousStepHref(step);
	const nextHref = getNextStepHref(step);

	if (definition === undefined) return null;

	const StepComponent = definition.Component;

	async function handleNext() {
		if (nextHref === undefined || !stepValid) return;
		setNavigationError(null);
		setIsAdvancing(true);
		try {
			await saveProgress(step + 1);
			router.push(nextHref);
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
				setStepValid,
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
						disabled={isAdvancing || !stepValid}
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

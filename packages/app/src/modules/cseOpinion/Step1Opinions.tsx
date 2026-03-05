"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccuracyOpinionCard } from "./components/AccuracyOpinionCard";
import { CseStepIndicator } from "./components/CseStepIndicator";
import { GapConsultationCard } from "./components/GapConsultationCard";
import { SubmissionBanner } from "./components/SubmissionBanner";
import styles from "./Step1Opinions.module.scss";
import type { CseOpinionStep1Data, OpinionType } from "./types";

type Props = {
	initialData?: CseOpinionStep1Data;
	email?: string;
};

export function Step1Opinions({ initialData, email }: Props) {
	const router = useRouter();

	const [firstDeclOpinion, setFirstDeclOpinion] = useState<OpinionType | null>(
		initialData?.firstDeclAccuracyOpinion ?? null,
	);
	const [firstDeclDate, setFirstDeclDate] = useState(
		initialData?.firstDeclAccuracyDate ?? "",
	);
	const [firstDeclGap, setFirstDeclGap] = useState<boolean | null>(
		initialData?.firstDeclGapConsulted ?? null,
	);
	const [firstDeclGapOpinion, setFirstDeclGapOpinion] =
		useState<OpinionType | null>(initialData?.firstDeclGapOpinion ?? null);
	const [firstDeclGapDate, setFirstDeclGapDate] = useState(
		initialData?.firstDeclGapDate ?? "",
	);

	const [secondDeclOpinion, setSecondDeclOpinion] =
		useState<OpinionType | null>(
			initialData?.secondDeclAccuracyOpinion ?? null,
		);
	const [secondDeclDate, setSecondDeclDate] = useState(
		initialData?.secondDeclAccuracyDate ?? "",
	);
	const [secondDeclGap, setSecondDeclGap] = useState<boolean | null>(
		initialData?.secondDeclGapConsulted ?? null,
	);
	const [secondDeclGapOpinion, setSecondDeclGapOpinion] =
		useState<OpinionType | null>(initialData?.secondDeclGapOpinion ?? null);
	const [secondDeclGapDate, setSecondDeclGapDate] = useState(
		initialData?.secondDeclGapDate ?? "",
	);

	const [validationError, setValidationError] = useState<string | null>(null);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const firstGapIncomplete =
			firstDeclGap === true && (!firstDeclGapOpinion || !firstDeclGapDate);
		const secondGapIncomplete =
			secondDeclGap === true && (!secondDeclGapOpinion || !secondDeclGapDate);

		if (
			!firstDeclOpinion ||
			!firstDeclDate ||
			firstDeclGap === null ||
			firstGapIncomplete ||
			!secondDeclOpinion ||
			!secondDeclDate ||
			secondDeclGap === null ||
			secondGapIncomplete
		) {
			setValidationError("Veuillez remplir tous les champs obligatoires.");
			return;
		}

		setValidationError(null);
		// TODO: call tRPC mutation when API is wired
		router.push("/avis-cse/etape/2");
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Parcours de mise en conformité pour l'indicateur par catégorie de
						salariés
					</h1>
				</div>
			</div>

			<SubmissionBanner
				deadline="1er février 2027"
				email={email ?? "adresse@exemple.fr"}
			/>

			<p className="fr-h4 fr-mt-5w fr-mb-3w" role="presentation">
				Transmettre l'avis ou les avis du CSE
			</p>

			<CseStepIndicator currentStep={1} />

			<p className="fr-text--md fr-mb-2w">
				Indiquez si le CSE a été consulté et précisez les avis émis avant de
				soumettre votre déclaration aux services du ministère chargé du Travail.
			</p>
			<p className="fr-mb-4w">Tous les champs sont obligatoires.</p>

			<h3 className="fr-h6 fr-mb-3w">Première déclaration</h3>

			<div className={styles.cardStack}>
				<AccuracyOpinionCard
					date={firstDeclDate}
					id="first-decl-accuracy"
					onDateChange={setFirstDeclDate}
					onOpinionChange={setFirstDeclOpinion}
					opinion={firstDeclOpinion}
					title="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
				/>

				<GapConsultationCard
					consulted={firstDeclGap}
					date={firstDeclGapDate}
					id="first-decl-gap"
					onConsultedChange={setFirstDeclGap}
					onDateChange={setFirstDeclGapDate}
					onOpinionChange={setFirstDeclGapOpinion}
					opinion={firstDeclGapOpinion}
				/>
			</div>

			<h3 className="fr-h6 fr-mt-5w fr-mb-3w">Deuxième déclaration</h3>

			<div className={styles.cardStack}>
				<AccuracyOpinionCard
					date={secondDeclDate}
					id="second-decl-accuracy"
					onDateChange={setSecondDeclDate}
					onOpinionChange={setSecondDeclOpinion}
					opinion={secondDeclOpinion}
					title="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
				/>

				<GapConsultationCard
					consulted={secondDeclGap}
					date={secondDeclGapDate}
					id="second-decl-gap"
					onConsultedChange={setSecondDeclGap}
					onDateChange={setSecondDeclGapDate}
					onOpinionChange={setSecondDeclGapOpinion}
					opinion={secondDeclGapOpinion}
				/>
			</div>

			<div aria-live="polite">
				{validationError && (
					<div className="fr-alert fr-alert--error fr-mt-3w">
						<p>{validationError}</p>
					</div>
				)}
			</div>

			<div className={`fr-mt-4w ${styles.actions}`}>
				<button
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					onClick={() => router.back()}
					type="button"
				>
					Précédent
				</button>
				<button
					className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
					type="submit"
				>
					Suivant
				</button>
			</div>
		</form>
	);
}

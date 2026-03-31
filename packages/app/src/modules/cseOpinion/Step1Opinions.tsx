"use client";

import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

import { getCseYear } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { AccuracyOpinionCard } from "./components/AccuracyOpinionCard";
import { CseStepIndicator } from "./components/CseStepIndicator";
import { GapConsultationCard } from "./components/GapConsultationCard";
import { SubmissionBanner } from "./components/SubmissionBanner";
import styles from "./Step1Opinions.module.scss";
import { saveOpinionsSchema } from "./schemas";
import formStyles from "./shared/formActions.module.scss";
import type { OpinionType } from "./types";

type Props = {
	initialData?: {
		firstDeclAccuracyOpinion: OpinionType | null;
		firstDeclAccuracyDate: string | null;
		firstDeclGapConsulted: boolean | null;
		firstDeclGapOpinion: OpinionType | null;
		firstDeclGapDate: string | null;
		secondDeclAccuracyOpinion: OpinionType | null;
		secondDeclAccuracyDate: string | null;
		secondDeclGapConsulted: boolean | null;
		secondDeclGapOpinion: OpinionType | null;
		secondDeclGapDate: string | null;
	};
	email?: string;
	compliancePath?: string | null;
	hasSecondDeclaration?: boolean;
};

export function Step1Opinions({
	initialData,
	email,
	compliancePath,
	hasSecondDeclaration = true,
}: Props) {
	const isJointEvaluation = compliancePath === "joint_evaluation";
	const router = useRouter();

	const form = useZodForm(saveOpinionsSchema, {
		defaultValues: {
			firstDeclaration: {
				accuracyOpinion: initialData?.firstDeclAccuracyOpinion ?? undefined,
				accuracyDate: initialData?.firstDeclAccuracyDate ?? "",
				gapConsulted: initialData?.firstDeclGapConsulted ?? undefined,
				gapOpinion: initialData?.firstDeclGapOpinion ?? null,
				gapDate: initialData?.firstDeclGapDate ?? null,
			},
			secondDeclaration: hasSecondDeclaration
				? {
						accuracyOpinion:
							initialData?.secondDeclAccuracyOpinion ?? undefined,
						accuracyDate: initialData?.secondDeclAccuracyDate ?? "",
						gapConsulted: initialData?.secondDeclGapConsulted ?? undefined,
						gapOpinion: initialData?.secondDeclGapOpinion ?? null,
						gapDate: initialData?.secondDeclGapDate ?? null,
					}
				: undefined,
		},
	});

	const mutation = api.cseOpinion.saveOpinions.useMutation({
		onSuccess: () => router.push("/avis-cse/etape/2"),
	});

	const onSubmit = form.handleSubmit((data) => {
		// Additional validation for conditional gap fields
		const firstGapIncomplete =
			data.firstDeclaration.gapConsulted === true &&
			(!data.firstDeclaration.gapOpinion || !data.firstDeclaration.gapDate);
		const secondGapIncomplete =
			hasSecondDeclaration &&
			data.secondDeclaration?.gapConsulted === true &&
			(!data.secondDeclaration?.gapOpinion || !data.secondDeclaration?.gapDate);

		if (firstGapIncomplete) {
			form.setError("firstDeclaration.gapOpinion", {
				message: "Veuillez remplir tous les champs de consultation.",
			});
			return;
		}

		if (secondGapIncomplete) {
			form.setError("secondDeclaration.gapOpinion", {
				message: "Veuillez remplir tous les champs de consultation.",
			});
			return;
		}

		mutation.mutate(data);
	});

	// Watch fields for controlled sub-components
	const firstDeclOpinion = form.watch("firstDeclaration.accuracyOpinion");
	const firstDeclDate = form.watch("firstDeclaration.accuracyDate");
	const firstDeclGapOpinion = form.watch("firstDeclaration.gapOpinion");
	const firstDeclGapDate = form.watch("firstDeclaration.gapDate");
	const secondDeclOpinion = form.watch("secondDeclaration.accuracyOpinion");
	const secondDeclDate = form.watch("secondDeclaration.accuracyDate");
	const secondDeclGapOpinion = form.watch("secondDeclaration.gapOpinion");
	const secondDeclGapDate = form.watch("secondDeclaration.gapDate");

	return (
		<form onSubmit={onSubmit}>
			{isJointEvaluation && (
				<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Parcours de mise en conformité pour l'indicateur par catégorie de
							salariés
						</h1>
					</div>
				</div>
			)}

			{isJointEvaluation && (
				<SubmissionBanner
					deadline={`1er février ${getCseYear()}`}
					email={email ?? "adresse@exemple.fr"}
				/>
			)}

			{isJointEvaluation ? (
				<h2 className="fr-h4 fr-mt-5w fr-mb-3w">
					Transmettre l'avis ou les avis du CSE
				</h2>
			) : (
				<h1 className="fr-h4 fr-mb-3w">
					Transmettre l'avis ou les avis du CSE
				</h1>
			)}

			<CseStepIndicator currentStep={1} />

			<p className="fr-text--md fr-mb-2w">
				Indiquez si le CSE a été consulté et précisez les avis émis avant de
				soumettre votre déclaration aux services du ministère chargé du Travail.
			</p>
			<p className="fr-mb-4w">Tous les champs sont obligatoires.</p>

			<h3 className="fr-h6 fr-mb-3w">Première déclaration</h3>

			<div className={styles.cardStack}>
				<AccuracyOpinionCard
					date={firstDeclDate ?? ""}
					id="first-decl-accuracy"
					onDateChange={(v) =>
						form.setValue("firstDeclaration.accuracyDate", v)
					}
					onOpinionChange={(v) =>
						form.setValue("firstDeclaration.accuracyOpinion", v)
					}
					opinion={firstDeclOpinion ?? null}
					title="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
				/>

				<Controller
					control={form.control}
					name="firstDeclaration.gapConsulted"
					render={({ field }) => (
						<GapConsultationCard
							consulted={field.value ?? null}
							date={firstDeclGapDate ?? ""}
							id="first-decl-gap"
							onConsultedChange={field.onChange}
							onDateChange={(v) => form.setValue("firstDeclaration.gapDate", v)}
							onOpinionChange={(v) =>
								form.setValue("firstDeclaration.gapOpinion", v)
							}
							opinion={firstDeclGapOpinion ?? null}
						/>
					)}
				/>
			</div>

			{hasSecondDeclaration && (
				<>
					<h3 className="fr-h6 fr-mt-5w fr-mb-3w">Deuxième déclaration</h3>

					<div className={styles.cardStack}>
						<AccuracyOpinionCard
							date={secondDeclDate ?? ""}
							id="second-decl-accuracy"
							onDateChange={(v) =>
								form.setValue("secondDeclaration.accuracyDate", v)
							}
							onOpinionChange={(v) =>
								form.setValue("secondDeclaration.accuracyOpinion", v)
							}
							opinion={secondDeclOpinion ?? null}
							title="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
						/>

						<Controller
							control={form.control}
							name="secondDeclaration.gapConsulted"
							render={({ field }) => (
								<GapConsultationCard
									consulted={field.value ?? null}
									date={secondDeclGapDate ?? ""}
									id="second-decl-gap"
									onConsultedChange={field.onChange}
									onDateChange={(v) =>
										form.setValue("secondDeclaration.gapDate", v)
									}
									onOpinionChange={(v) =>
										form.setValue("secondDeclaration.gapOpinion", v)
									}
									opinion={secondDeclGapOpinion ?? null}
								/>
							)}
						/>
					</div>
				</>
			)}

			<div aria-live="polite">
				{(form.formState.errors.firstDeclaration ||
					form.formState.errors.secondDeclaration) && (
					<div className="fr-alert fr-alert--error fr-mt-3w">
						<p>Veuillez remplir tous les champs obligatoires.</p>
					</div>
				)}
				{mutation.error && (
					<div className="fr-alert fr-alert--error fr-mt-3w">
						<p>{mutation.error.message}</p>
					</div>
				)}
			</div>

			<div className={`fr-mt-4w ${formStyles.actions}`}>
				<button
					className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
					onClick={() => router.back()}
					type="button"
				>
					Précédent
				</button>
				<button
					className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
					disabled={mutation.isPending}
					type="submit"
				>
					{mutation.isPending ? "Enregistrement…" : "Suivant"}
				</button>
			</div>
		</form>
	);
}

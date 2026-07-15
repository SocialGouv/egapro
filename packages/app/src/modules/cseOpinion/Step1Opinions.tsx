"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";

import { useReadOnlyGuard } from "~/modules/auth";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { getCurrentYear } from "~/modules/domain";
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
	cseDeadline: Date;
	siren: string;
	year: number;
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
	firstDeclarationPathChoice?: string | null;
	hasSecondDeclaration?: boolean;
	previousHref?: string;
};

export function Step1Opinions({
	cseDeadline,
	siren,
	year,
	initialData,
	email,
	firstDeclarationPathChoice,
	hasSecondDeclaration = true,
	previousHref = "/declaration-remuneration/etape/6",
}: Props) {
	const isJointEvaluation = firstDeclarationPathChoice === "joint_evaluation";
	const router = useRouter();
	const readOnlyGuard = useReadOnlyGuard();
	const { isReadOnly } = useLockContext();

	const dbValues = useMemo(
		() => ({
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
		}),
		[initialData, hasSecondDeclaration],
	);

	const { draft, setField, isLoadingDraft } = useDeclarationDraft({
		siren,
		year,
		step: "opinions",
		kind: "cse",
		dbValues,
	});

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

	useEffect(() => {
		if (isLoadingDraft) return;
		const fd = draft.firstDeclaration;
		if (fd) {
			if (fd.accuracyOpinion !== undefined)
				form.setValue("firstDeclaration.accuracyOpinion", fd.accuracyOpinion);
			if (fd.accuracyDate !== undefined)
				form.setValue("firstDeclaration.accuracyDate", fd.accuracyDate);
			if (fd.gapConsulted !== undefined)
				form.setValue("firstDeclaration.gapConsulted", fd.gapConsulted);
			if (fd.gapOpinion !== undefined)
				form.setValue("firstDeclaration.gapOpinion", fd.gapOpinion);
			if (fd.gapDate !== undefined)
				form.setValue("firstDeclaration.gapDate", fd.gapDate);
		}
		if (hasSecondDeclaration) {
			const sd = draft.secondDeclaration;
			if (sd) {
				if (sd.accuracyOpinion !== undefined)
					form.setValue(
						"secondDeclaration.accuracyOpinion",
						sd.accuracyOpinion,
					);
				if (sd.accuracyDate !== undefined)
					form.setValue("secondDeclaration.accuracyDate", sd.accuracyDate);
				if (sd.gapConsulted !== undefined)
					form.setValue("secondDeclaration.gapConsulted", sd.gapConsulted);
				if (sd.gapOpinion !== undefined)
					form.setValue("secondDeclaration.gapOpinion", sd.gapOpinion);
				if (sd.gapDate !== undefined)
					form.setValue("secondDeclaration.gapDate", sd.gapDate);
			}
		}
	}, [isLoadingDraft, draft, form, hasSecondDeclaration]);

	const triggerDraftSave = useCallback(() => {
		if (isReadOnly) return;
		const values = form.getValues();
		setField({
			firstDeclaration: values.firstDeclaration,
			secondDeclaration: values.secondDeclaration,
		});
	}, [form, isReadOnly, setField]);

	const mutation = api.cseOpinion.saveOpinions.useMutation({
		onSuccess: () => router.push("/avis-cse/etape/2"),
	});

	const onSubmit = form.handleSubmit((data) => {
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

	const firstDeclOpinion = form.watch("firstDeclaration.accuracyOpinion");
	const firstDeclDate = form.watch("firstDeclaration.accuracyDate");
	const firstDeclGapOpinion = form.watch("firstDeclaration.gapOpinion");
	const firstDeclGapDate = form.watch("firstDeclaration.gapDate");
	const secondDeclOpinion = form.watch("secondDeclaration.accuracyOpinion");
	const secondDeclDate = form.watch("secondDeclaration.accuracyDate");
	const secondDeclGapOpinion = form.watch("secondDeclaration.gapOpinion");
	const secondDeclGapDate = form.watch("secondDeclaration.gapDate");

	if (isLoadingDraft) {
		return <p>Chargement...</p>;
	}

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			{/* noValidate: the required radios expose the required state to
			    assistive tech (RGAA 11.10) without native browser bubbles
			    preempting the app's own zod + custom validation messages. */}
			{/* Read-only mode is enforced per control (disabled radios, readOnly
			    dates, disabled submit button): a fieldset-level `disabled` would
			    hide the content from some assistive technologies (#3803). */}
			<fieldset className={styles.readOnlyFieldset}>
				<legend className="fr-sr-only">Avis du CSE</legend>
				{isJointEvaluation && (
					<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
						<div className="fr-col">
							<h1 className="fr-h4 fr-mb-0">
								Parcours de mise en conformité pour l'indicateur par catégorie
								de salariés
							</h1>
						</div>
					</div>
				)}

				{isJointEvaluation && (
					<SubmissionBanner
						deadline={cseDeadline}
						email={email ?? "adresse@exemple.fr"}
						year={getCurrentYear()}
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
					soumettre votre déclaration aux services du ministère chargé du
					Travail.
				</p>
				<p className="fr-mb-4w">Tous les champs sont obligatoires.</p>

				{isJointEvaluation ? (
					<h3 className="fr-h6 fr-mb-3w">Première déclaration</h3>
				) : (
					<h2 className="fr-h6 fr-mb-3w">Première déclaration</h2>
				)}

				<div className={styles.cardStack}>
					<AccuracyOpinionCard
						date={firstDeclDate ?? ""}
						id="first-decl-accuracy"
						onDateChange={(v) => {
							form.setValue("firstDeclaration.accuracyDate", v);
							triggerDraftSave();
						}}
						onOpinionChange={(v) => {
							form.setValue("firstDeclaration.accuracyOpinion", v);
							triggerDraftSave();
						}}
						opinion={firstDeclOpinion ?? null}
						readOnly={isReadOnly}
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
								onConsultedChange={(v) => {
									field.onChange(v);
									triggerDraftSave();
								}}
								onDateChange={(v) => {
									form.setValue("firstDeclaration.gapDate", v);
									triggerDraftSave();
								}}
								onOpinionChange={(v) => {
									form.setValue("firstDeclaration.gapOpinion", v);
									triggerDraftSave();
								}}
								opinion={firstDeclGapOpinion ?? null}
								readOnly={isReadOnly}
							/>
						)}
					/>
				</div>

				{hasSecondDeclaration && (
					<>
						{isJointEvaluation ? (
							<h3 className="fr-h6 fr-mt-5w fr-mb-3w">Deuxième déclaration</h3>
						) : (
							<h2 className="fr-h6 fr-mt-5w fr-mb-3w">Deuxième déclaration</h2>
						)}

						<div className={styles.cardStack}>
							<AccuracyOpinionCard
								date={secondDeclDate ?? ""}
								id="second-decl-accuracy"
								onDateChange={(v) => {
									form.setValue("secondDeclaration.accuracyDate", v);
									triggerDraftSave();
								}}
								onOpinionChange={(v) => {
									form.setValue("secondDeclaration.accuracyOpinion", v);
									triggerDraftSave();
								}}
								opinion={secondDeclOpinion ?? null}
								readOnly={isReadOnly}
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
										onConsultedChange={(v) => {
											field.onChange(v);
											triggerDraftSave();
										}}
										onDateChange={(v) => {
											form.setValue("secondDeclaration.gapDate", v);
											triggerDraftSave();
										}}
										onOpinionChange={(v) => {
											form.setValue("secondDeclaration.gapOpinion", v);
											triggerDraftSave();
										}}
										opinion={secondDeclGapOpinion ?? null}
										readOnly={isReadOnly}
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
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href={previousHref}
					>
						Précédent
					</Link>
					<span>
						<button
							{...readOnlyGuard.buttonProps}
							className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
							disabled={mutation.isPending || isReadOnly}
							type="submit"
						>
							{mutation.isPending ? "Enregistrement…" : "Suivant"}
						</button>
						{readOnlyGuard.tooltip}
					</span>
				</div>
			</fieldset>
		</form>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useIsImpersonating } from "~/modules/auth";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep1Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP1_CATEGORIES } from "../shared/devFillData";
import { DraftLoadingState } from "../shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { useDraftHydration } from "../shared/draft/useDraftHydration";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { PrefillResetWarning } from "../shared/PrefillResetWarning";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { Step1Data } from "../types";
import styles from "./Step1Workforce.module.scss";

type Step1WorkforceProps = {
	declarationSiren: string;
	declarationYear: number;
	initialData: Step1Data;
	gipPrefillData?: GipPrefillData;
};

export function Step1Workforce({
	declarationSiren,
	declarationYear,
	initialData,
	gipPrefillData,
}: Step1WorkforceProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const isPrefilled = !!gipPrefillData;

	const hasInitialData = initialData.totalWomen > 0 || initialData.totalMen > 0;

	const dbValues = useMemo(
		() => ({
			totalWomen: initialData.totalWomen,
			totalMen: initialData.totalMen,
		}),
		[initialData.totalWomen, initialData.totalMen],
	);

	const {
		draft,
		setField,
		clearDraft,
		hasDraft,
		isLoadingDraft,
		isSaving,
		isPendingSave,
	} = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: 1,
		kind: "main",
		dbValues,
	});

	const form = useZodForm(updateStep1Schema, {
		defaultValues: dbValues,
	});

	const totalWomen = form.watch("totalWomen");
	const totalMen = form.watch("totalMen");
	const total = totalWomen + totalMen;

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (typeof d.totalWomen === "number")
			form.setValue("totalWomen", d.totalWomen);
		if (typeof d.totalMen === "number") form.setValue("totalMen", d.totalMen);
	});

	const hasData = hasInitialData || hasDraft;
	const [validationError, setValidationError] = useState<string | null>(null);
	const [showResetWarning, setShowResetWarning] = useState(false);

	function handleInputFocus(currentValue: number) {
		if (currentValue > 0) setShowResetWarning(true);
	}

	const mutation = api.declaration.updateStep1.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/2");
		},
	});

	function parseIntegerInput(raw: string): number | null {
		if (raw === "") return 0;
		if (/\D/.test(raw)) return null;
		return Number.parseInt(raw, 10);
	}

	function handleWomenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = parseIntegerInput(e.target.value);
		if (value === null) return;
		form.setValue("totalWomen", value);
		setField({ totalWomen: value, totalMen });
	}

	function handleMenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = parseIntegerInput(e.target.value);
		if (value === null) return;
		form.setValue("totalMen", value);
		setField({ totalWomen, totalMen: value });
	}

	if (!draftHydrated) return <DraftLoadingState />;

	const onSubmit = form.handleSubmit((data) => {
		if (data.totalWomen + data.totalMen === 0) {
			setValidationError(
				"Veuillez renseigner les effectifs avant de passer à l'étape suivante.",
			);
			return;
		}
		setValidationError(null);
		mutation.mutate(data);
	});

	return (
		<form
			autoComplete="off"
			className={common.flexColumnGap2}
			onSubmit={onSubmit}
		>
			<StepTitleRow
				hasData={hasData}
				isPendingSave={isPendingSave}
				isSaving={isSaving}
				onDevFill={() => {
					const womenValue = DEV_STEP1_CATEGORIES[0]?.women ?? 50;
					const menValue = DEV_STEP1_CATEGORIES[0]?.men ?? 50;
					form.setValue("totalWomen", womenValue);
					form.setValue("totalMen", menValue);
					setField({ totalWomen: womenValue, totalMen: menValue });
				}}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {declarationYear}
					</h1>
				}
			/>

			<StepIndicator currentStep={1} />

			<div className={common.flexColumnGap1}>
				<p className="fr-mb-0">
					Période de référence pour le calcul des indicateurs : 01/01/2026 -
					31/12/2026.
					<TooltipButton
						id="tooltip-period"
						label="Information sur la période de référence"
						text="Pour les entreprises créées en cours d'année, cette période correspond à la durée d'activité effective depuis la date de création jusqu'au 31/12/2026."
					/>
				</p>

				<p className={`fr-mb-0 ${common.fontMedium}`}>
					{isPrefilled
						? "Vérifiez les informations préremplies à partir de vos données DSN et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
						: "Renseignez l'effectif physique de votre entreprise."}
					<TooltipButton
						id="tooltip-workforce"
						label="Information sur les effectifs"
						text="Les informations saisies sont confidentielles et utilisées uniquement pour le calcul des indicateurs d'égalité professionnelle."
					/>
				</p>

				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			<div className={common.dataSection}>
				<div className={common.flexColumnGapHalf}>
					<div
						className={`fr-table fr-table--no-caption fr-mt-0 fr-mb-0 ${styles.workforceTable}`}
					>
						<div className="fr-table__wrapper">
							<div className="fr-table__container">
								<div className="fr-table__content">
									<table>
										<caption>
											Effectifs physiques pris en compte pour le calcul des
											indicateurs
										</caption>
										<colgroup>
											<col className={styles.labelCol} />
											<col className={styles.inputCol} />
											<col className={styles.inputCol} />
											<col className={styles.totalCol} />
										</colgroup>
										<thead>
											<tr>
												<th scope="col">{/* vide */}</th>
												<th scope="col">Femmes</th>
												<th scope="col">Hommes</th>
												<th scope="col">Total</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<strong>Nombre de salariés</strong>
												</td>
												<td>
													<input
														aria-label="Nombre de femmes"
														className={`fr-input ${common.numericInput}`}
														disabled={isImpersonating}
														inputMode="numeric"
														onChange={handleWomenChange}
														onFocus={() => handleInputFocus(totalWomen)}
														pattern="[0-9]*"
														type="text"
														value={totalWomen > 0 ? String(totalWomen) : ""}
													/>
												</td>
												<td>
													<input
														aria-label="Nombre d'hommes"
														className={`fr-input ${common.numericInput}`}
														disabled={isImpersonating}
														inputMode="numeric"
														onChange={handleMenChange}
														onFocus={() => handleInputFocus(totalMen)}
														pattern="[0-9]*"
														type="text"
														value={totalMen > 0 ? String(totalMen) : ""}
													/>
												</td>
												<td>
													<strong>{total}</strong>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

					{isPrefilled && (
						<PrefillSource periodEnd={gipPrefillData.periodEnd} />
					)}

					{showResetWarning && <PrefillResetWarning />}
				</div>

				<DefinitionAccordion
					id="accordion-step1"
					title="Définitions et méthode de calcul"
				>
					<div className="fr-callout">
						<p>Les informations affichées incluront notamment&nbsp;:</p>
						<ul>
							<li>Dernière situation connue&nbsp;?</li>
							<li>Effectif physique moyen&nbsp;?</li>
							<li>
								Comment sont intégrés les salariés entrés et sortis&nbsp;?
							</li>
							<li>
								Comment sont traités les changements de situation (ex. passage
								du temps plein au temps partiel)&nbsp;?
							</li>
							<li>
								Les absences de six mois ou plus, continues ou discontinues,
								sont-elles exclues du calcul&nbsp;?
							</li>
							<li>
								Comment sont prises en compte les absences de trois mois, avec
								leur recalcul en équivalent temps plein (ETP)&nbsp;?
							</li>
							<li>
								Le détail des règles de calcul, illustré par des exemples
								concrets selon les types de salariés&nbsp;? (Salariés à prendre
								en compte / Salariés à exclure)
							</li>
						</ul>
					</div>
				</DefinitionAccordion>
			</div>

			<FormErrors
				mutationError={mutation.error?.message}
				validationError={validationError}
			/>

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				mimoquageNextHref={
					hasInitialData ? "/declaration-remuneration/etape/2" : undefined
				}
				previousHref="/"
			/>
		</form>
	);
}

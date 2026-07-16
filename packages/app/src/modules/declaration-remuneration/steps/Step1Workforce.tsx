"use client";

import { useRouter } from "next/navigation";

import { useMemo, useRef, useState } from "react";

import { useIsImpersonating } from "~/modules/auth";
import {
	computeWorkforceTotal,
	resolveGipReferencePeriod,
} from "~/modules/domain";
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
import { useLockContext } from "../shared/lock/LockContext";
import { PrefillResetConfirmDialog } from "../shared/PrefillResetConfirmDialog";
import { PrefillResetWarning } from "../shared/PrefillResetWarning";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { Step1Data } from "../types";
import styles from "./Step1Workforce.module.scss";
import { Step1WorkforceDefinition } from "./Step1WorkforceDefinition";

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
	const { isReadOnly } = useLockContext();
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
	const total = computeWorkforceTotal(totalWomen, totalMen);

	const [womenRaw, setWomenRaw] = useState(() =>
		initialData.totalWomen > 0 ? String(initialData.totalWomen) : "",
	);
	const [menRaw, setMenRaw] = useState(() =>
		initialData.totalMen > 0 ? String(initialData.totalMen) : "",
	);
	const [womenError, setWomenError] = useState<string | null>(null);
	const [menError, setMenError] = useState<string | null>(null);

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (typeof d.totalWomen === "number") {
			form.setValue("totalWomen", d.totalWomen);
			setWomenRaw(d.totalWomen > 0 ? String(d.totalWomen) : "");
		}
		if (typeof d.totalMen === "number") {
			form.setValue("totalMen", d.totalMen);
			setMenRaw(d.totalMen > 0 ? String(d.totalMen) : "");
		}
	});

	const hasData = hasInitialData || hasDraft;

	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const pendingSubmitData = useRef<{
		totalWomen: number;
		totalMen: number;
	} | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const mutation = api.declaration.updateStep1.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/2");
		},
	});

	function parseIntegerInput(raw: string): number | null {
		if (raw === "") return null;
		if (/\D/.test(raw)) return null;
		return Number.parseInt(raw, 10);
	}

	const shouldConfirmReset =
		hasInitialData &&
		(parseIntegerInput(womenRaw) !== dbValues.totalWomen ||
			parseIntegerInput(menRaw) !== dbValues.totalMen);

	function handleConfirm() {
		dialogRef.current?.close();
		if (pendingSubmitData.current) {
			mutation.mutate(pendingSubmitData.current);
		}
	}

	function handleCancelModal() {
		dialogRef.current?.close();
		pendingSubmitData.current = null;
	}

	const showResetWarning =
		gipPrefillData !== undefined &&
		((gipPrefillData.step1.totalWomen !== null &&
			parseIntegerInput(womenRaw) !== gipPrefillData.step1.totalWomen) ||
			(gipPrefillData.step1.totalMen !== null &&
				parseIntegerInput(menRaw) !== gipPrefillData.step1.totalMen));

	function handleWomenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		setWomenRaw(raw);
		setWomenError(null);
		const value = parseIntegerInput(raw);
		if (value === null) return;
		form.setValue("totalWomen", value);
		setField({ totalWomen: value, totalMen });
	}

	function handleMenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		setMenRaw(raw);
		setMenError(null);
		const value = parseIntegerInput(raw);
		if (value === null) return;
		form.setValue("totalMen", value);
		setField({ totalWomen, totalMen: value });
	}

	if (!draftHydrated) return <DraftLoadingState />;

	const onSubmit = form.handleSubmit((data) => {
		const womenEmpty = womenRaw === "";
		const menEmpty = menRaw === "";

		if (womenEmpty) {
			setWomenError("Veuillez renseigner le nombre de femmes.");
		}
		if (menEmpty) {
			setMenError("Veuillez renseigner le nombre d'hommes.");
		}
		if (womenEmpty || menEmpty) return;

		setValidationError(null);
		if (shouldConfirmReset) {
			pendingSubmitData.current = data;
			dialogRef.current?.showModal();
			return;
		}
		mutation.mutate(data);
	});

	return (
		<>
			<form
				autoComplete="off"
				className={common.flexColumnGap2}
				onSubmit={onSubmit}
			>
				{/* Read-only mode is enforced per control (readOnly inputs, disabled
				    buttons): a fieldset-level `disabled` would hide the content from
				    some assistive technologies (#3803). */}
				<fieldset className={common.readOnlyFieldset}>
					<legend className="fr-sr-only">Effectifs</legend>
					<StepTitleRow
						devFillDisabled={isReadOnly}
						hasData={hasData}
						isPendingSave={isPendingSave}
						isSaving={isSaving}
						onDevFill={() => {
							const womenValue = DEV_STEP1_CATEGORIES[0]?.women ?? 50;
							const menValue = DEV_STEP1_CATEGORIES[0]?.men ?? 50;
							form.setValue("totalWomen", womenValue);
							form.setValue("totalMen", menValue);
							setWomenRaw(String(womenValue));
							setMenRaw(String(menValue));
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
							{`Période de référence pour le calcul des indicateurs : ${resolveGipReferencePeriod(gipPrefillData?.periodStart, gipPrefillData?.periodEnd, declarationYear)}.`}
							<TooltipButton
								id="tooltip-period"
								label="Information sur la période de référence"
								text={`Pour les entreprises créées en cours d'année, cette période correspond à la durée d'activité effective depuis la date de création jusqu'au 31/12/${declarationYear}.`}
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

					<div className={`${common.dataSection} ${common.tableGap}`}>
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
														<th scope="col">
															<span className="fr-sr-only">Donnée</span>
														</th>
														<th scope="col">Femmes</th>
														<th scope="col">Hommes</th>
														<th scope="col">Total</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<th scope="row">Nombre de salariés</th>
														<td>
															<div
																className={
																	womenError
																		? "fr-input-group fr-input-group--error"
																		: "fr-input-group"
																}
															>
																<input
																	aria-describedby={
																		womenError ? "women-error" : undefined
																	}
																	aria-invalid={womenError ? true : undefined}
																	aria-label="Nombre de femmes"
																	className={`fr-input ${common.numericInput}${womenError ? "fr-input--error" : ""}`}
																	disabled={isImpersonating}
																	inputMode="numeric"
																	onChange={handleWomenChange}
																	pattern="[0-9]*"
																	readOnly={isReadOnly}
																	type="text"
																	value={womenRaw}
																/>
																{womenError && (
																	<p className="fr-error-text" id="women-error">
																		{womenError}
																	</p>
																)}
															</div>
														</td>
														<td>
															<div
																className={
																	menError
																		? "fr-input-group fr-input-group--error"
																		: "fr-input-group"
																}
															>
																<input
																	aria-describedby={
																		menError ? "men-error" : undefined
																	}
																	aria-invalid={menError ? true : undefined}
																	aria-label="Nombre d'hommes"
																	className={`fr-input ${common.numericInput}${menError ? "fr-input--error" : ""}`}
																	disabled={isImpersonating}
																	inputMode="numeric"
																	onChange={handleMenChange}
																	pattern="[0-9]*"
																	readOnly={isReadOnly}
																	type="text"
																	value={menRaw}
																/>
																{menError && (
																	<p className="fr-error-text" id="men-error">
																		{menError}
																	</p>
																)}
															</div>
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
								<PrefillSource
									periodEnd={gipPrefillData.periodEnd}
									periodStart={gipPrefillData.periodStart}
									year={declarationYear}
								/>
							)}

							{showResetWarning && <PrefillResetWarning />}
						</div>

						<DefinitionAccordion
							id="accordion-step1"
							title="Définitions et méthode de calcul"
						>
							<Step1WorkforceDefinition />
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
					/>
				</fieldset>
			</form>
			<PrefillResetConfirmDialog
				dialogRef={dialogRef}
				onCancel={handleCancelModal}
				onConfirm={handleConfirm}
			/>
		</>
	);
}

"use client";

import { useRouter } from "next/navigation";

import { useMemo, useRef, useState } from "react";

import { useIsImpersonating } from "~/modules/auth";
import { getReferencePeriod, getReferenceYearFor } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep1Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP1_ROWS } from "../shared/devFillData";
import { DraftLoadingState } from "../shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { useDraftHydration } from "../shared/draft/useDraftHydration";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { FieldErrorAlert } from "../shared/formError/FieldErrorAlert";
import type { FieldError } from "../shared/formError/types";
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
import { WorkforceTableRow } from "./step1/WorkforceTableRow";
import type { WorkforceField } from "./step1/workforceRows";
import {
	WORKFORCE_FIELDS,
	WORKFORCE_ROWS,
	workforceFieldErrorMessage,
	workforceFieldId,
	workforceFieldIdFromField,
} from "./step1/workforceRows";

type RawValues = Record<WorkforceField, string>;

type Step1WorkforceProps = {
	declarationSiren: string;
	declarationYear: number;
	indicatorGRequired: boolean;
	initialData: Step1Data;
	gipPrefillData?: GipPrefillData;
};

const WORKFORCE_ALERT_ID = "step1-workforce-error";

function toRaw(values: Step1Data): RawValues {
	return {
		totalWomen: values.totalWomen > 0 ? String(values.totalWomen) : "",
		totalMen: values.totalMen > 0 ? String(values.totalMen) : "",
		hourlyWomen: values.hourlyWomen > 0 ? String(values.hourlyWomen) : "",
		hourlyMen: values.hourlyMen > 0 ? String(values.hourlyMen) : "",
	};
}

function parseIntegerInput(raw: string): number | null {
	if (raw === "") return null;
	if (/\D/.test(raw)) return null;
	return Number.parseInt(raw, 10);
}

export function Step1Workforce({
	declarationSiren,
	declarationYear,
	indicatorGRequired,
	initialData,
	gipPrefillData,
}: Step1WorkforceProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const { isReadOnly } = useLockContext();
	const isPrefilled = !!gipPrefillData;

	const hasInitialData = WORKFORCE_FIELDS.some(
		(field) => initialData[field] > 0,
	);

	const dbValues = useMemo(
		(): Step1Data => ({
			totalWomen: initialData.totalWomen,
			totalMen: initialData.totalMen,
			hourlyWomen: initialData.hourlyWomen,
			hourlyMen: initialData.hourlyMen,
		}),
		[
			initialData.totalWomen,
			initialData.totalMen,
			initialData.hourlyWomen,
			initialData.hourlyMen,
		],
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

	const values: Record<WorkforceField, number> = {
		totalWomen: form.watch("totalWomen"),
		totalMen: form.watch("totalMen"),
		hourlyWomen: form.watch("hourlyWomen"),
		hourlyMen: form.watch("hourlyMen"),
	};

	const [raw, setRaw] = useState<RawValues>(() => toRaw(initialData));
	const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		for (const field of WORKFORCE_FIELDS) {
			const value = d[field];
			if (typeof value !== "number") continue;
			form.setValue(field, value);
			setRaw((prev) => ({
				...prev,
				[field]: value > 0 ? String(value) : "",
			}));
		}
	});

	const hasData = hasInitialData || hasDraft;

	const dialogRef = useRef<HTMLDialogElement | null>(null);
	const pendingSubmitData = useRef<Step1Data | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const mutation = api.declaration.updateStep1.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/2");
		},
	});

	const shouldConfirmReset =
		hasInitialData &&
		WORKFORCE_FIELDS.some(
			(field) => parseIntegerInput(raw[field]) !== dbValues[field],
		);

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
		WORKFORCE_FIELDS.some((field) => {
			const prefilled = gipPrefillData.step1[field];
			return prefilled !== null && parseIntegerInput(raw[field]) !== prefilled;
		});

	function handleFieldChange(field: WorkforceField, value: string) {
		setRaw((prev) => ({ ...prev, [field]: value }));
		setFieldErrors((prev) =>
			prev.filter(
				(error) => error.fieldId !== workforceFieldIdFromField(field),
			),
		);
		const parsed = parseIntegerInput(value);
		if (parsed === null) return;
		form.setValue(field, parsed);
		setField({ ...values, [field]: parsed });
	}

	function fillForDev() {
		const [annual, hourly] = DEV_STEP1_ROWS;
		const filled: Step1Data = {
			totalWomen: annual?.women ?? 50,
			totalMen: annual?.men ?? 50,
			hourlyWomen: hourly?.women ?? 50,
			hourlyMen: hourly?.men ?? 50,
		};
		for (const field of WORKFORCE_FIELDS) {
			form.setValue(field, filled[field]);
		}
		setRaw(toRaw(filled));
		setFieldErrors([]);
		setField(filled);
	}

	if (!draftHydrated) return <DraftLoadingState />;

	const onSubmit = form.handleSubmit((data) => {
		const missing: FieldError[] = [];
		for (const row of WORKFORCE_ROWS) {
			if (raw[row.womenField] === "") {
				missing.push({
					fieldId: workforceFieldId(row, "women"),
					category: "empty",
					message: workforceFieldErrorMessage(row, "women"),
				});
			}
			if (raw[row.menField] === "") {
				missing.push({
					fieldId: workforceFieldId(row, "men"),
					category: "empty",
					message: workforceFieldErrorMessage(row, "men"),
				});
			}
		}
		setFieldErrors(missing);
		if (missing.length > 0) return;

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
						onDevFill={fillForDev}
						title={
							<h1 className="fr-h4 fr-mb-0">
								Déclaration des indicateurs de rémunération {declarationYear}
							</h1>
						}
					/>

					<StepIndicator
						currentStep={1}
						indicatorGRequired={indicatorGRequired}
					/>

					<div className={common.flexColumnGap1}>
						<p className="fr-mb-0">
							{`Période de référence pour le calcul des indicateurs : ${getReferencePeriod(declarationYear)}.`}
							<TooltipButton
								id="tooltip-period"
								label="Information sur la période de référence"
								text={`Pour les entreprises créées en cours d'année, cette période correspond à la durée d'activité effective depuis la date de création jusqu'au 31/12/${getReferenceYearFor(declarationYear)}.`}
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
								className={`fr-table fr-table--bordered fr-table--no-caption fr-mt-0 fr-mb-0 ${styles.workforceTable}`}
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
														<th scope="col">Nombre de salariés</th>
														<th scope="col">Femmes</th>
														<th scope="col">Hommes</th>
														<th scope="col">Total</th>
													</tr>
												</thead>
												<tbody>
													{WORKFORCE_ROWS.map((row) => (
														<WorkforceTableRow
															disabled={isImpersonating}
															errorAlertId={WORKFORCE_ALERT_ID}
															errors={fieldErrors}
															key={row.basis}
															onFieldChange={handleFieldChange}
															raw={raw}
															readOnly={isReadOnly}
															row={row}
															values={values}
														/>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>

							{isPrefilled && <PrefillSource year={declarationYear} />}

							<FieldErrorAlert errors={fieldErrors} id={WORKFORCE_ALERT_ID} />

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

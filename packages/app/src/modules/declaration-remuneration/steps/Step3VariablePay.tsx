"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useIsImpersonating } from "~/modules/auth";
import {
	formatVariablePayProportion,
	normalizeDecimalInput,
	padDecimalToTwo,
} from "~/modules/domain";
import { TooltipButton } from "~/modules/shared/TooltipButton";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep3Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import {
	DEV_STEP3_BENEFICIARY_MEN,
	DEV_STEP3_BENEFICIARY_WOMEN,
	DEV_STEP3_ROWS,
} from "../shared/devFillData";
import { DraftLoadingState } from "../shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { useDraftAutoSave } from "../shared/draft/useDraftAutoSave";
import { useDraftHydration } from "../shared/draft/useDraftHydration";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { FieldErrorAlert } from "../shared/formError/FieldErrorAlert";
import {
	derivePayGapErrors,
	payGapFieldId,
} from "../shared/formError/payGapErrors";
import type { FieldError } from "../shared/formError/types";
import { describedByForField, findFieldError } from "../shared/formError/types";
import { GapInterpretationCallout } from "../shared/GapInterpretationCallout";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { gipToStep3 } from "../shared/gipToStepData";
import {
	getStep3FieldName,
	gipPayGapReferences,
	step3ToRows,
} from "../shared/indicatorRowMapping";
import { useLockContext } from "../shared/lock/LockContext";
import { numericInputClassName } from "../shared/numericInputClassName";
import { PayGapTable } from "../shared/PayGapTable";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import type { PayGapField, Step3Data } from "../types";
import stepStyles from "./Step3VariablePay.module.scss";

type Step3VariablePayProps = {
	declarationSiren: string;
	declarationYear: number;
	indicatorGRequired: boolean;
	initialData: Step3Data;
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

function padStep3(data: Step3Data): Step3Data {
	return Object.fromEntries(
		Object.entries(data).map(([k, v]) =>
			k === "indicatorEWomen" || k === "indicatorEMen"
				? [k, v]
				: [k, padDecimalToTwo(v)],
		),
	) as Step3Data;
}

const PAY_GAP_ID_PREFIX = "step3-paygap";
const PAY_GAP_ALERT_ID = "step3-paygap-error";
const BENEFICIARIES_ALERT_ID = "step3-beneficiaries-error";
const BENEFICIARY_FIELD_IDS = {
	indicatorEWomen: "step3-beneficiaries-f",
	indicatorEMen: "step3-beneficiaries-h",
} as const;
const BENEFICIARY_LABELS = {
	indicatorEWomen: "de femmes bénéficiaires",
	indicatorEMen: "d'hommes bénéficiaires",
} as const;

function deriveBenefError(
	field: "indicatorEWomen" | "indicatorEMen",
	value: string,
	max: number | undefined,
): FieldError | null {
	if (value === "") return null;
	const n = Number.parseInt(value, 10);
	if (Number.isNaN(n) || max === undefined || n <= max) return null;
	return {
		fieldId: BENEFICIARY_FIELD_IDS[field],
		category: "invalid",
		message: `Le nombre ${BENEFICIARY_LABELS[field]} ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
	};
}

// Re-derives from the current value — a stale error state would miss a value written outside a keystroke.
function deriveBenefErrors(
	values: Pick<Step3Data, "indicatorEWomen" | "indicatorEMen">,
	maxWomen: number | undefined,
	maxMen: number | undefined,
): FieldError[] {
	return (["indicatorEWomen", "indicatorEMen"] as const)
		.map((field) =>
			deriveBenefError(
				field,
				values[field],
				field === "indicatorEWomen" ? maxWomen : maxMen,
			),
		)
		.filter((error): error is FieldError => error !== null);
}

export function Step3VariablePay({
	declarationSiren,
	declarationYear,
	indicatorGRequired,
	initialData,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step3VariablePayProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const { isReadOnly } = useLockContext();

	const hasSavedData = Object.values(initialData).some((v) => v !== "");

	const rawDefaults = hasSavedData
		? initialData
		: gipPrefillData
			? gipToStep3(gipPrefillData.step3)
			: initialData;
	const defaultValues = padStep3(rawDefaults);
	const dbValues = useMemo(() => padStep3(initialData), [initialData]);

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
		step: 3,
		kind: "main",
		dbValues,
	});

	const form = useZodForm(updateStep3Schema, { defaultValues });

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		(Object.keys(d) as Array<keyof Step3Data>).forEach((key) => {
			const value = d[key];
			if (value !== undefined) form.setValue(key, value as string);
		});
	});

	useDraftAutoSave(form, draftHydrated && !isReadOnly, (values) =>
		setField(values as Step3Data),
	);

	const formData = form.watch();
	const rows = step3ToRows(
		formData as Step3Data,
		gipPayGapReferences(gipPrefillData?.step3),
	);
	const beneficiaryWomen = formData.indicatorEWomen ?? "";
	const beneficiaryMen = formData.indicatorEMen ?? "";

	const [benefErrors, setBenefErrors] = useState<FieldError[]>([]);
	const hasData = hasSavedData || hasDraft;
	const [payGapErrors, setPayGapErrors] = useState<FieldError[]>([]);
	const [validationAttempt, setValidationAttempt] = useState(0);

	const mutation = api.declaration.updateStep3.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/4");
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const normalized = normalizeDecimalInput(value);
		if (normalized === null) return;
		if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
		const fieldName = getStep3FieldName(index, field);
		form.setValue(fieldName, normalized);
		setPayGapErrors((errors) =>
			errors.filter(
				(error) =>
					error.fieldId !== payGapFieldId(PAY_GAP_ID_PREFIX, index, field),
			),
		);
	}

	function handleBenefChange(
		field: "indicatorEWomen" | "indicatorEMen",
		max: number | undefined,
		value: string,
	) {
		if (value !== "" && /\D/.test(value)) return;
		form.setValue(field, value);
		const error = deriveBenefError(field, value, max);
		setBenefErrors((errors) => [
			...errors.filter((e) => e.fieldId !== BENEFICIARY_FIELD_IDS[field]),
			...(error ? [error] : []),
		]);
	}

	const womenBeneficiaryError = findFieldError(
		benefErrors,
		BENEFICIARY_FIELD_IDS.indicatorEWomen,
	);
	const menBeneficiaryError = findFieldError(
		benefErrors,
		BENEFICIARY_FIELD_IDS.indicatorEMen,
	);

	const onSubmit = form.handleSubmit(() => {
		setValidationAttempt((attempt) => attempt + 1);
		const tableErrors = derivePayGapErrors(PAY_GAP_ID_PREFIX, rows);
		setPayGapErrors(tableErrors);

		const missingBeneficiaries: FieldError[] = (
			["indicatorEWomen", "indicatorEMen"] as const
		)
			.filter((field) =>
				field === "indicatorEWomen" ? !beneficiaryWomen : !beneficiaryMen,
			)
			.map((field) => ({
				fieldId: BENEFICIARY_FIELD_IDS[field],
				category: "empty" as const,
				message: `Renseignez le nombre ${BENEFICIARY_LABELS[field]}.`,
			}));
		const exceedsMaxBeneficiaries = deriveBenefErrors(
			{ indicatorEWomen: beneficiaryWomen, indicatorEMen: beneficiaryMen },
			maxWomen,
			maxMen,
		).filter(
			(error) =>
				!missingBeneficiaries.some(
					(missing) => missing.fieldId === error.fieldId,
				),
		);
		const beneficiaryErrors = [
			...missingBeneficiaries,
			...exceedsMaxBeneficiaries,
		];
		setBenefErrors(beneficiaryErrors);

		if (tableErrors.length > 0 || beneficiaryErrors.length > 0) return;
		mutation.mutate(form.getValues() as Step3Data);
	});

	return (
		<form
			autoComplete="off"
			className={common.flexColumnGap2}
			onSubmit={onSubmit}
		>
			{/* Read-only mode is enforced per control (readOnly inputs, disabled
			    buttons): a fieldset-level `disabled` would hide the content from
			    some assistive technologies (#3803). */}
			<fieldset className={common.readOnlyFieldset}>
				<legend className="fr-sr-only">
					Rémunérations variables ou complémentaires
				</legend>
				<StepTitleRow
					devFillDisabled={isReadOnly}
					hasData={hasData}
					isPendingSave={isPendingSave}
					isSaving={isSaving}
					onDevFill={() => {
						DEV_STEP3_ROWS.forEach((row, i) => {
							const womenField = getStep3FieldName(i, "womenValue");
							const menField = getStep3FieldName(i, "menValue");
							form.setValue(womenField, padDecimalToTwo(row.womenValue));
							form.setValue(menField, padDecimalToTwo(row.menValue));
						});
						form.setValue("indicatorEWomen", DEV_STEP3_BENEFICIARY_WOMEN);
						form.setValue("indicatorEMen", DEV_STEP3_BENEFICIARY_MEN);
						setPayGapErrors([]);
						setBenefErrors([]);
					}}
					title={
						<h1 className="fr-h4 fr-mb-0">
							Déclaration des indicateurs de rémunération {declarationYear}
						</h1>
					}
				/>

				<StepIndicator
					currentStep={3}
					indicatorGRequired={indicatorGRequired}
				/>

				<div className={common.flexColumnGap1}>
					<p className="fr-mb-0">
						Ces indicateurs évaluent et comparent les rémunérations variables
						(primes, bonus, avantages…) entre les femmes et les hommes. Ils
						mesurent à la fois l&apos;écart moyen et médian des montants perçus
						ainsi que la proportion de femmes et d&apos;hommes bénéficiant de
						ces rémunérations.
					</p>

					<p className={`fr-mb-0 ${common.fontMedium}`}>
						{gipPrefillData
							? "Vérifiez les informations préremplies et modifiez-les si nécessaire avant de valider vos indicateurs."
							: "Renseignez les informations avant de valider vos indicateurs."}
						{!gipPrefillData && (
							<TooltipButton
								id="tooltip-step3-info"
								label="Information sur la confidentialité des données"
								text="Les informations saisies sont confidentielles et utilisées uniquement pour le calcul des indicateurs d'égalité professionnelle."
							/>
						)}
					</p>

					<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
				</div>

				<div className={`${common.dataSection} ${common.tableGap}`}>
					<div className={common.flexColumnGap1}>
						<h2 className="fr-h6 fr-mb-0">
							Rémunération variable ou complémentaire
						</h2>
						<PayGapTable
							caption="Écart de rémunération variable ou complémentaire"
							className={stepStyles.payGapTable}
							columnHeader={
								<span className="fr-sr-only">Type de rémunération</span>
							}
							disabled={isImpersonating}
							errorAlertId={PAY_GAP_ALERT_ID}
							errors={payGapErrors}
							idPrefix={PAY_GAP_ID_PREFIX}
							onRowChange={handleRowChange}
							readOnly={isReadOnly}
							rows={rows}
						/>

						{gipPrefillData && (
							<PrefillSource
								tooltipId="tooltip-source-step3-paygap"
								year={declarationYear}
							/>
						)}

						<FieldErrorAlert
							errors={payGapErrors}
							id={PAY_GAP_ALERT_ID}
							validationAttempt={validationAttempt}
						/>
					</div>

					<div className={common.flexColumnGap1}>
						<h2 className="fr-h6 fr-mb-0">
							Proportion de femmes et d&apos;hommes bénéficiaires
						</h2>
						<div
							className={`fr-table fr-table--bordered fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.payGapTable}`}
						>
							<div className="fr-table__wrapper">
								<div className="fr-table__container">
									<div className="fr-table__content">
										<table>
											<caption>
												Bénéficiaires de composantes variables ou
												complémentaires
											</caption>
											<colgroup>
												<col className={stepStyles.colSex} />
												<col className={stepStyles.colCount} />
												<col className={stepStyles.colCount} />
												<col />
											</colgroup>
											<thead>
												<tr>
													<th scope="col">
														<span className="fr-sr-only">Sexe</span>
													</th>
													<th scope="col">
														Total de salariés
														{maxWomen !== undefined && maxMen !== undefined
															? ` : ${maxWomen + maxMen}`
															: ""}
													</th>
													<th scope="col">
														Bénéficiaires de composantes
														<br />
														variables ou complémentaires
													</th>
													<th scope="col">Proportion</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<th scope="row">Femmes</th>
													<td className="fr-cell--right">
														<strong>{maxWomen ?? "-"}</strong>
													</td>
													<td>
														<input
															aria-describedby={describedByForField(
																BENEFICIARIES_ALERT_ID,
																womenBeneficiaryError,
															)}
															aria-invalid={
																womenBeneficiaryError ? true : undefined
															}
															aria-label="Bénéficiaires femmes"
															className={numericInputClassName(
																Boolean(womenBeneficiaryError),
															)}
															disabled={isImpersonating}
															id={BENEFICIARY_FIELD_IDS.indicatorEWomen}
															inputMode="numeric"
															onChange={(e) =>
																handleBenefChange(
																	"indicatorEWomen",
																	maxWomen,
																	e.target.value,
																)
															}
															pattern="[0-9]*"
															readOnly={isReadOnly}
															type="text"
															value={beneficiaryWomen}
														/>
													</td>
													<td className="fr-cell--right">
														<strong>
															{formatVariablePayProportion(
																beneficiaryWomen,
																maxWomen,
															)}
														</strong>
													</td>
												</tr>
												<tr>
													<th scope="row">Hommes</th>
													<td className="fr-cell--right">
														<strong>{maxMen ?? "-"}</strong>
													</td>
													<td>
														<input
															aria-describedby={describedByForField(
																BENEFICIARIES_ALERT_ID,
																menBeneficiaryError,
															)}
															aria-invalid={
																menBeneficiaryError ? true : undefined
															}
															aria-label="Bénéficiaires hommes"
															className={numericInputClassName(
																Boolean(menBeneficiaryError),
															)}
															disabled={isImpersonating}
															id={BENEFICIARY_FIELD_IDS.indicatorEMen}
															inputMode="numeric"
															onChange={(e) =>
																handleBenefChange(
																	"indicatorEMen",
																	maxMen,
																	e.target.value,
																)
															}
															pattern="[0-9]*"
															readOnly={isReadOnly}
															type="text"
															value={beneficiaryMen}
														/>
													</td>
													<td className="fr-cell--right">
														<strong>
															{formatVariablePayProportion(
																beneficiaryMen,
																maxMen,
															)}
														</strong>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>

						{gipPrefillData && (
							<PrefillSource
								tooltipId="tooltip-source-step3"
								year={declarationYear}
							/>
						)}

						<FieldErrorAlert
							errors={benefErrors}
							focusOnValidation={payGapErrors.length === 0}
							id={BENEFICIARIES_ALERT_ID}
							validationAttempt={validationAttempt}
						/>
					</div>

					<DefinitionAccordion
						id="accordion-step3"
						title="Définitions et méthode de calcul"
					>
						<div className="fr-callout">
							<ul>
								<li>
									Quelles composantes de la rémunération sont incluses dans le
									calcul (ex. véhicule de fonction, repas, prime de
									participation, etc.)&nbsp;?
								</li>
								<li>
									Les bons codes rubrique DSN sont-ils bien utilisés pour
									chacune de ces composantes&nbsp;?
								</li>
								<li>
									Comment vérifier ou identifier les codes DSN associés aux
									éléments de rémunération pris en compte&nbsp;?
								</li>
							</ul>
						</div>
					</DefinitionAccordion>
				</div>

				<GapInterpretationCallout
					beneficiaryMen={beneficiaryMen}
					beneficiaryWomen={beneficiaryWomen}
					maxMen={maxMen}
					maxWomen={maxWomen}
					rows={rows}
					variant="variablePay"
				/>

				<FormErrors mutationError={mutation.error?.message} />

				<FormActions
					isSubmitting={mutation.isPending}
					mimoquageNextHref={
						hasSavedData ? "/declaration-remuneration/etape/4" : undefined
					}
					previousHref="/declaration-remuneration/etape/2"
				/>
			</fieldset>
		</form>
	);
}

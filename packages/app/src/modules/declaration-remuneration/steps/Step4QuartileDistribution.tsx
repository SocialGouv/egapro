"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useIsImpersonating } from "~/modules/auth";
import { normalizeDecimalInput, padDecimalToTwo } from "~/modules/domain";
import { useZodForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import { updateStep4Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP4_ANNUAL, DEV_STEP4_HOURLY } from "../shared/devFillData";
import { DraftLoadingState } from "../shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { useDraftAutoSave } from "../shared/draft/useDraftAutoSave";
import { useDraftHydration } from "../shared/draft/useDraftHydration";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { getNextStepHref } from "../shared/funnelSteps";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { useLockContext } from "../shared/lock/LockContext";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import type { QuartileTuple, Step4Data } from "../types";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { QuartileInterpretationCallout } from "./step4/QuartileInterpretationCallout";
import { QuartileTable } from "./step4/QuartileTable";
import {
	buildRecap,
	type CountField,
	deriveErrors,
	emptyErrorMap,
	type FieldErrorMap,
	hasAnyError,
	type TableType,
} from "./step4/quartileErrors";
import {
	computeMinsForTable,
	emptyQuartiles,
	gipToQuartiles,
	normalizeForMutation,
	toQuartileData,
} from "./step4/quartileFormHelpers";

function padThresholds(qs: QuartileTuple): QuartileTuple {
	return qs.map((q, i) => ({
		...q,
		threshold: i === 3 ? undefined : padDecimalToTwo(q.threshold ?? ""),
	})) as QuartileTuple;
}

type Step4QuartileDistributionProps = {
	declarationSiren: string;
	declarationYear: number;
	indicatorGRequired: boolean;
	initialData: Step4Data;
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

export function Step4QuartileDistribution({
	declarationSiren,
	declarationYear,
	indicatorGRequired,
	initialData,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const { isReadOnly } = useLockContext();
	const alertRef = useRef<HTMLDivElement | null>(null);

	const hasSavedData =
		initialData.annual.some(
			(q) => q.threshold || q.women !== undefined || q.men !== undefined,
		) ||
		initialData.hourly.some(
			(q) => q.threshold || q.women !== undefined || q.men !== undefined,
		);

	const defaultAnnual = padThresholds(
		(hasSavedData
			? initialData.annual
			: gipPrefillData
				? gipToQuartiles(gipPrefillData.step4.annual)
				: emptyQuartiles()) as QuartileTuple,
	);

	const defaultHourly = padThresholds(
		(hasSavedData
			? initialData.hourly
			: gipPrefillData
				? gipToQuartiles(gipPrefillData.step4.hourly)
				: emptyQuartiles()) as QuartileTuple,
	);

	const dbValues = useMemo(
		() => ({
			annual: padThresholds(
				hasSavedData ? (initialData.annual as QuartileTuple) : emptyQuartiles(),
			),
			hourly: padThresholds(
				hasSavedData ? (initialData.hourly as QuartileTuple) : emptyQuartiles(),
			),
		}),
		[hasSavedData, initialData],
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
		step: 4,
		kind: "main",
		dbValues,
	});

	const form = useZodForm(updateStep4Schema, {
		defaultValues: {
			annual: defaultAnnual as QuartileTuple,
			hourly: defaultHourly as QuartileTuple,
		},
	});

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (d.annual) form.setValue("annual", d.annual);
		if (d.hourly) form.setValue("hourly", d.hourly);
	});

	useDraftAutoSave(form, draftHydrated && !isReadOnly, (values) =>
		setField({
			annual: values.annual as QuartileTuple,
			hourly: values.hourly as QuartileTuple,
		}),
	);

	const annual = form.watch("annual");
	const hourly = form.watch("hourly");

	const [maxError, setMaxError] = useState<string | null>(null);
	const hasData = hasSavedData || hasDraft;
	const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>(emptyErrorMap);
	const [showRecap, setShowRecap] = useState(false);

	const nextHref = getNextStepHref(4, indicatorGRequired);

	const mutation = api.declaration.updateStep4.useMutation({
		onSuccess: () => {
			clearDraft();
			if (nextHref) router.push(nextHref);
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	function setQuartileField(
		tableType: TableType,
		index: number,
		field: "threshold" | CountField,
		value: string | number | undefined,
	) {
		const arr = tableType === "annual" ? [...annual] : [...hourly];
		const current = arr[index];
		if (current) {
			arr[index] = { ...current, [field]: value };
		}
		form.setValue(tableType, arr as QuartileTuple);
	}

	function clearFieldError(
		tableType: TableType,
		index: number,
		field: "threshold" | CountField,
	) {
		setFieldErrors((prev) => {
			const next: FieldErrorMap = {
				annual: [...prev.annual] as FieldErrorMap["annual"],
				hourly: [...prev.hourly] as FieldErrorMap["hourly"],
			};
			const cell = { ...(next[tableType][index] ?? {}) };
			delete cell[field];
			next[tableType][index] = cell;
			return next;
		});
	}

	function handleQuartileChange(
		tableType: TableType,
		index: number,
		field: "threshold" | CountField,
		value: string,
	) {
		if (field === "threshold") {
			const normalized = normalizeDecimalInput(value);
			if (normalized === null) return;
			if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
			setQuartileField(
				tableType,
				index,
				field,
				normalized === "" ? undefined : normalized,
			);
		} else {
			if (value === "") {
				setQuartileField(tableType, index, field, undefined);
				setMaxError(null);
				clearFieldError(tableType, index, field);
				return;
			}
			if (/\D/.test(value)) return;
			const n = Number.parseInt(value, 10);
			if (Number.isNaN(n) || n < 0) return;
			const max = field === "women" ? maxWomen : maxMen;
			if (max !== undefined && n > max) {
				setMaxError(
					`Le nombre ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
				);
				return;
			}
			setMaxError(null);
			setQuartileField(tableType, index, field, n);
		}
		clearFieldError(tableType, index, field);
	}

	function focusAlert() {
		requestAnimationFrame(() => alertRef.current?.focus());
	}

	function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = form.getValues();
		const errors = deriveErrors(values);
		if (hasAnyError(errors)) {
			setFieldErrors(errors);
			setShowRecap(true);
			focusAlert();
			return;
		}
		setFieldErrors(emptyErrorMap());
		setShowRecap(false);
		mutation.mutate(normalizeForMutation(values));
	}

	const annualMins = computeMinsForTable(annual);
	const hourlyMins = computeMinsForTable(hourly);

	const recap = buildRecap(fieldErrors);
	const showAlert = showRecap && recap.length > 0;

	return (
		<form
			autoComplete="off"
			className={stepStyles.formColumn}
			noValidate
			onSubmit={onSubmit}
		>
			{/* Read-only mode is enforced per control (readOnly inputs, disabled
			    buttons): a fieldset-level `disabled` would hide the content from
			    some assistive technologies (#3803). */}
			<fieldset className={common.readOnlyFieldset}>
				<legend className="fr-sr-only">Distribution par quartile</legend>
				<StepTitleRow
					devFillDisabled={isReadOnly}
					hasData={hasData}
					isPendingSave={isPendingSave}
					isSaving={isSaving}
					onDevFill={() => {
						form.setValue(
							"annual",
							padThresholds(
								DEV_STEP4_ANNUAL.map(toQuartileData) as QuartileTuple,
							),
						);
						form.setValue(
							"hourly",
							padThresholds(
								DEV_STEP4_HOURLY.map(toQuartileData) as QuartileTuple,
							),
						);
						setFieldErrors(emptyErrorMap());
						setShowRecap(false);
					}}
					title={
						<h1 className="fr-h4 fr-mb-0">
							Déclaration des indicateurs de rémunération {declarationYear}
						</h1>
					}
				/>

				<StepIndicator
					currentStep={4}
					indicatorGRequired={indicatorGRequired}
				/>

				<div className={stepStyles.instructions}>
					<p className="fr-mb-0">
						Cet indicateur répartit l&apos;ensemble des salariés en quatre
						groupes de rémunération appelés quartiles&nbsp;: du quartile
						inférieur qui regroupe les salariés les moins rémunérés, au quartile
						supérieur qui rassemble les salariés les mieux rémunérés.
					</p>

					{gipPrefillData ? (
						<p className="fr-mb-0">
							<strong>
								Vérifiez les informations préremplies et modifiez-les si
								nécessaire avant de valider vos indicateurs.
							</strong>
						</p>
					) : (
						<p className={`fr-mb-0 ${stepStyles.introMedium}`}>
							Renseignez les informations avant de valider vos indicateurs.
						</p>
					)}

					<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
				</div>

				{showAlert && (
					<div
						aria-labelledby="step4-error-summary-title"
						className="fr-alert fr-alert--error"
						ref={alertRef}
						role="alert"
						tabIndex={-1}
					>
						<h3 className="fr-alert__title" id="step4-error-summary-title">
							Le formulaire contient des erreurs
						</h3>
						<ul>
							{recap.map((entry) => (
								<li key={entry.id}>
									<a href={`#${entry.id}`}>{entry.label}</a>
								</li>
							))}
						</ul>
					</div>
				)}

				<div className={stepStyles.dataContainer}>
					<QuartileTable
						disabled={isImpersonating}
						errors={fieldErrors.annual}
						mins={annualMins}
						onQuartileChange={(index, field, value) =>
							handleQuartileChange("annual", index, field, value)
						}
						quartiles={annual}
						readOnly={isReadOnly}
						sourceNote={
							gipPrefillData ? (
								<PrefillSource
									periodEnd={gipPrefillData.periodEnd ?? null}
									periodStart={gipPrefillData.periodStart}
									tooltipId="tooltip-source-step4-annual"
									year={declarationYear}
								/>
							) : undefined
						}
						tableType="annual"
						title="Rémunération annuelle brute moyenne"
					/>

					<QuartileTable
						disabled={isImpersonating}
						errors={fieldErrors.hourly}
						mins={hourlyMins}
						onQuartileChange={(index, field, value) =>
							handleQuartileChange("hourly", index, field, value)
						}
						quartiles={hourly}
						readOnly={isReadOnly}
						sourceNote={
							gipPrefillData ? (
								<PrefillSource
									periodEnd={gipPrefillData.periodEnd ?? null}
									periodStart={gipPrefillData.periodStart}
									tooltipId="tooltip-source-step4-hourly"
									year={declarationYear}
								/>
							) : undefined
						}
						tableType="hourly"
						title="Rémunération horaire brute moyenne"
					/>

					<DefinitionAccordion
						id="accordion-step4"
						title="Définitions et méthode de calcul"
					>
						<div className="fr-callout">
							<ul>
								<li>
									Quelles données sont prises en compte dans les calculs&nbsp;?
								</li>
								<li>
									Les calculs incluent-ils uniquement le salaire de base ou
									également les primes&nbsp;?
								</li>
								<li>
									Sont-ils réalisés en équivalent temps plein, en salaire brut
									horaire ou selon une autre modalité&nbsp;?
								</li>
								<li>
									Que signifie la notion de «&nbsp;quartile&nbsp;» dans ce
									contexte&nbsp;? Définir simplement un quartile pour permettre
									à l&apos;utilisateur de s&apos;assurer qu&apos;il comprend
									bien cette notion.
								</li>
								<li>
									À quoi servent les quartiles présentés&nbsp;? Quelle est la
									finalité des quartiles lorsqu&apos;ils sont affichés sans
									échelle ou référence comparative&nbsp;?
								</li>
							</ul>
						</div>
					</DefinitionAccordion>
				</div>

				{gipPrefillData && (
					<QuartileInterpretationCallout
						annualCategories={annual}
						hourlyCategories={hourly}
					/>
				)}

				<FormErrors
					mutationError={mutation.error?.message}
					validationError={maxError}
				/>

				<FormActions
					isSubmitting={mutation.isPending}
					mimoquageNextHref={hasSavedData ? nextHref : undefined}
					previousHref="/declaration-remuneration/etape/3"
				/>
			</fieldset>
		</form>
	);
}

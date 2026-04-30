"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useIsImpersonating } from "~/modules/auth";
import { normalizeDecimalInput } from "~/modules/domain";
import { useZodForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import { updateStep4Schema } from "../schemas";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP4_ANNUAL, DEV_STEP4_HOURLY } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { QuartileTuple, Step4Data } from "../types";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { QuartileInterpretationCallout } from "./step4/QuartileInterpretationCallout";
import { QuartileReadingNote } from "./step4/QuartileReadingNote";
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

type Step4QuartileDistributionProps = {
	declarationYear: number;
	initialData: Step4Data;
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

export function Step4QuartileDistribution({
	declarationYear,
	initialData,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const alertRef = useRef<HTMLDivElement | null>(null);

	const hasSavedData =
		initialData.annual.some(
			(q) => q.threshold || q.women !== undefined || q.men !== undefined,
		) ||
		initialData.hourly.some(
			(q) => q.threshold || q.women !== undefined || q.men !== undefined,
		);

	const defaultAnnual = hasSavedData
		? initialData.annual
		: gipPrefillData
			? gipToQuartiles(gipPrefillData.step4.annual)
			: emptyQuartiles();

	const defaultHourly = hasSavedData
		? initialData.hourly
		: gipPrefillData
			? gipToQuartiles(gipPrefillData.step4.hourly)
			: emptyQuartiles();

	const form = useZodForm(updateStep4Schema, {
		defaultValues: {
			annual: defaultAnnual as QuartileTuple,
			hourly: defaultHourly as QuartileTuple,
		},
	});

	const annual = form.watch("annual");
	const hourly = form.watch("hourly");

	const [maxError, setMaxError] = useState<string | null>(null);
	const [saved, setSaved] = useState(hasSavedData);
	const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>(emptyErrorMap);
	const [showRecap, setShowRecap] = useState(false);

	const mutation = api.declaration.updateStep4.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/5"),
	});

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
				setSaved(false);
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
		setSaved(false);
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
		<form className={stepStyles.formColumn} noValidate onSubmit={onSubmit}>
			<StepTitleRow
				onDevFill={() => {
					form.setValue(
						"annual",
						DEV_STEP4_ANNUAL.map(toQuartileData) as QuartileTuple,
					);
					form.setValue(
						"hourly",
						DEV_STEP4_HOURLY.map(toQuartileData) as QuartileTuple,
					);
					setSaved(false);
					setFieldErrors(emptyErrorMap());
					setShowRecap(false);
				}}
				saved={saved}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {declarationYear}
					</h1>
				}
			/>

			<StepIndicator currentStep={4} />

			<div className={stepStyles.instructions}>
				<p className="fr-mb-0">
					Cet indicateur compare la proportion de femmes et d&apos;hommes selon
					les niveaux de rémunération. Les rémunérations sont classées de la
					plus faible à la plus élevée puis divisées en quatre groupes de même
					taille appelés quartiles&nbsp;: le 1<sup>er</sup> quartile correspond
					aux 25 % des salariés les moins rémunérés, le 2<sup>e</sup> quartile
					(médiane) aux 50 % des salariés situés au milieu de la distribution,
					le 3<sup>e</sup> quartile aux salariés situés entre 50 % et 75 % des
					rémunérations, et le 4<sup>e</sup> quartile correspond aux 25 % des
					salariés les mieux rémunérés.
				</p>

				<p className="fr-mb-0">
					<strong>
						{gipPrefillData
							? "Vérifiez les informations préremplies et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
							: "Renseignez les informations avant de valider vos indicateurs."}
					</strong>
					<TooltipButton
						id="tooltip-step4-info"
						label="Information sur les indicateurs"
					/>
				</p>

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
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={annual}
								tableType="annual"
								year={declarationYear}
							/>
						) : undefined
					}
					sourceNote={
						<PrefillSource
							periodEnd={gipPrefillData?.periodEnd ?? null}
							periodStart={gipPrefillData?.periodStart ?? null}
						/>
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
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={hourly}
								tableType="hourly"
								year={declarationYear}
							/>
						) : undefined
					}
					sourceNote={
						<PrefillSource
							periodEnd={gipPrefillData?.periodEnd ?? null}
							periodStart={gipPrefillData?.periodStart ?? null}
						/>
					}
					tableType="hourly"
					title="Rémunération horaire brute moyenne"
				/>

				<DefinitionAccordion
					id="accordion-step4"
					title="Définitions et méthode de calcul"
				/>
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
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				mimoquageNextHref={
					hasSavedData ? "/declaration-remuneration/etape/5" : undefined
				}
				previousHref="/declaration-remuneration/etape/3"
			/>
		</form>
	);
}

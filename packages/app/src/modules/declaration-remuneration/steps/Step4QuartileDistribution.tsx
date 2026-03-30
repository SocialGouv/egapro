"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCurrentYear, normalizeDecimalInput } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep4Schema } from "../schemas";
import { QUARTILE_NAMES } from "../shared/constants";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP4_ANNUAL, DEV_STEP4_HOURLY } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import type { GipPrefillData, GipQuartileData } from "../shared/gipMdsMapping";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { QuartileData, Step4Data } from "../types";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { QuartileInterpretationCallout } from "./step4/QuartileInterpretationCallout";
import { QuartileReadingNote } from "./step4/QuartileReadingNote";
import { QuartileTable } from "./step4/QuartileTable";

function gipToQuartiles(gip: GipQuartileData): QuartileData[] {
	return QUARTILE_NAMES.map((_, i) => ({
		threshold: gip.thresholds[i] ?? "",
		women: gip.womenCounts[i] ?? undefined,
		men: gip.menCounts[i] ?? undefined,
	}));
}

function emptyQuartiles(): [
	QuartileData,
	QuartileData,
	QuartileData,
	QuartileData,
] {
	return [
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
		{ threshold: "" },
	];
}

type Step4QuartileDistributionProps = {
	initialData: Step4Data;
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

export function Step4QuartileDistribution({
	initialData,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();

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
			annual: defaultAnnual as [
				QuartileData,
				QuartileData,
				QuartileData,
				QuartileData,
			],
			hourly: defaultHourly as [
				QuartileData,
				QuartileData,
				QuartileData,
				QuartileData,
			],
		},
	});

	const annual = form.watch("annual");
	const hourly = form.watch("hourly");

	const [validationError, setValidationError] = useState<string | null>(null);
	const [saved, setSaved] = useState(hasSavedData);
	const [formValidationError, setFormValidationError] = useState<string | null>(
		null,
	);

	const currentYear = getCurrentYear();

	const mutation = api.declaration.updateStep4.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/5"),
	});

	function setQuartileField(
		tableType: "annual" | "hourly",
		index: number,
		field: "threshold" | "women" | "men",
		value: string | number | undefined,
	) {
		const arr = tableType === "annual" ? [...annual] : [...hourly];
		arr[index] = { ...arr[index]!, [field]: value };
		form.setValue(
			tableType,
			arr as [QuartileData, QuartileData, QuartileData, QuartileData],
		);
	}

	function handleQuartileChange(
		tableType: "annual" | "hourly",
		index: number,
		field: "threshold" | "women" | "men",
		value: string,
	) {
		if (field === "threshold") {
			const normalized = normalizeDecimalInput(value);
			if (normalized === null) return;
			if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
			setQuartileField(tableType, index, field, normalized || undefined);
		} else {
			if (value === "") {
				setQuartileField(tableType, index, field, undefined);
				setValidationError(null);
				setSaved(false);
				return;
			}
			if (/\D/.test(value)) return;
			const n = Number.parseInt(value, 10);
			if (Number.isNaN(n) || n < 0) return;
			const max = field === "women" ? maxWomen : maxMen;
			if (max !== undefined && n > max) {
				setValidationError(
					`Le nombre ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
				);
				return;
			}
			setValidationError(null);
			setQuartileField(tableType, index, field, n);
		}
		setSaved(false);
	}

	const onSubmit = form.handleSubmit(() => {
		const allQuartiles = [...annual, ...hourly];
		const incomplete = allQuartiles.some(
			(q) => q.women === undefined || q.men === undefined || !q.threshold,
		);
		if (incomplete) {
			setFormValidationError(
				"Veuillez renseigner toutes les données avant de passer à l'étape suivante.",
			);
			return;
		}
		setFormValidationError(null);
		mutation.mutate(form.getValues());
	});

	return (
		<form className={stepStyles.formColumn} onSubmit={onSubmit}>
			<StepTitleRow
				onDevFill={() => {
					const devAnnual = DEV_STEP4_ANNUAL.map((c) => ({
						threshold: c.womenValue ?? "",
						women: c.womenCount,
						men: c.menCount,
					}));
					const devHourly = DEV_STEP4_HOURLY.map((c) => ({
						threshold: c.womenValue ?? "",
						women: c.womenCount,
						men: c.menCount,
					}));
					form.setValue(
						"annual",
						devAnnual as [
							QuartileData,
							QuartileData,
							QuartileData,
							QuartileData,
						],
					);
					form.setValue(
						"hourly",
						devHourly as [
							QuartileData,
							QuartileData,
							QuartileData,
							QuartileData,
						],
					);
					setSaved(false);
				}}
				saved={saved}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				}
			/>

			<StepIndicator currentStep={4} />

			{/* Description + instructions */}
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

			{/* Tables */}
			<div className={stepStyles.dataContainer}>
				<QuartileTable
					maxMen={maxMen}
					maxWomen={maxWomen}
					onQuartileChange={(index, field, value) =>
						handleQuartileChange("annual", index, field, value)
					}
					quartiles={annual}
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={annual}
								tableType="annual"
								year={currentYear}
							/>
						) : undefined
					}
					sourceNote={
						gipPrefillData ? (
							<PrefillSource
								periodEnd={gipPrefillData.periodEnd}
								tooltipId="tooltip-source-step4-annual"
							/>
						) : undefined
					}
					tableType="annual"
					title="Rémunération annuelle brute moyenne"
					validationError={null}
				/>

				<QuartileTable
					maxMen={maxMen}
					maxWomen={maxWomen}
					onQuartileChange={(index, field, value) =>
						handleQuartileChange("hourly", index, field, value)
					}
					quartiles={hourly}
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={hourly}
								tableType="hourly"
								year={currentYear}
							/>
						) : undefined
					}
					sourceNote={
						gipPrefillData ? (
							<PrefillSource
								periodEnd={gipPrefillData.periodEnd}
								tooltipId="tooltip-source-step4-hourly"
							/>
						) : undefined
					}
					tableType="hourly"
					title="Rémunération horaire brute moyenne"
					validationError={validationError}
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
				validationError={formValidationError}
			/>

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/3"
			/>
		</form>
	);
}

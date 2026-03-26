"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCurrentYear, normalizeDecimalInput } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStepCategoriesSchema } from "../schemas";
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
import type { StepCategoryData } from "../types";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { QuartileInterpretationCallout } from "./step4/QuartileInterpretationCallout";
import { QuartileReadingNote } from "./step4/QuartileReadingNote";
import { QuartileTable } from "./step4/QuartileTable";

function buildGipQuartileCategories(
	quartile: GipQuartileData,
): StepCategoryData[] {
	return QUARTILE_NAMES.map((name, i) => ({
		name,
		womenValue: quartile.thresholds[i] ?? undefined,
		womenCount: quartile.womenCounts[i] ?? undefined,
		menCount: quartile.menCounts[i] ?? undefined,
	}));
}

function stepToFormCategories(
	annual: StepCategoryData[],
	hourly: StepCategoryData[],
) {
	return [
		...annual.map((c) => ({
			name: `annual:${c.name}`,
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		})),
		...hourly.map((c) => ({
			name: `hourly:${c.name}`,
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		})),
	];
}

function formToStepCategories(
	categories: {
		name?: string;
		womenCount?: number;
		menCount?: number;
		womenValue?: string;
	}[],
	prefix: "annual" | "hourly",
): StepCategoryData[] {
	return categories
		.filter((c) => c.name?.startsWith(`${prefix}:`))
		.map((c) => ({
			name: c.name?.replace(`${prefix}:`, "") ?? "",
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		}));
}

type Step4QuartileDistributionProps = {
	initialAnnualCategories?: StepCategoryData[];
	initialHourlyCategories?: StepCategoryData[];
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

export function Step4QuartileDistribution({
	initialAnnualCategories,
	initialHourlyCategories,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();

	const emptyCategories = () =>
		QUARTILE_NAMES.map((name) => ({ name })) as StepCategoryData[];

	const defaultAnnual = initialAnnualCategories?.length
		? initialAnnualCategories
		: gipPrefillData
			? buildGipQuartileCategories(gipPrefillData.step4.annual)
			: emptyCategories();

	const defaultHourly = initialHourlyCategories?.length
		? initialHourlyCategories
		: gipPrefillData
			? buildGipQuartileCategories(gipPrefillData.step4.hourly)
			: emptyCategories();

	const hasInitialData = [
		...(initialAnnualCategories ?? []),
		...(initialHourlyCategories ?? []),
	].some(
		(c) =>
			c.womenCount !== undefined ||
			c.menCount !== undefined ||
			c.womenValue !== undefined ||
			c.menValue !== undefined,
	);

	const form = useZodForm(updateStepCategoriesSchema, {
		defaultValues: {
			step: 4,
			categories: stepToFormCategories(defaultAnnual, defaultHourly),
		},
	});

	const categories = form.watch("categories");
	const annualCategories = formToStepCategories(categories, "annual");
	const hourlyCategories = formToStepCategories(categories, "hourly");

	const [validationError, setValidationError] = useState<string | null>(null);
	const [saved, setSaved] = useState(hasInitialData);
	const [formValidationError, setFormValidationError] = useState<string | null>(
		null,
	);

	const currentYear = getCurrentYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/5"),
	});

	function handleCategoryChange(
		tableType: "annual" | "hourly",
		index: number,
		field: "womenValue" | "womenCount" | "menCount",
		value: string,
	) {
		const formIndex =
			tableType === "annual" ? index : index + QUARTILE_NAMES.length;

		if (field === "womenValue") {
			const normalized = normalizeDecimalInput(value);
			if (normalized === null) return;
			if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
			form.setValue(
				`categories.${formIndex}.womenValue`,
				normalized || undefined,
			);
		} else {
			if (value === "") {
				form.setValue(`categories.${formIndex}.${field}`, undefined);
				setValidationError(null);
				setSaved(false);
				return;
			}
			if (/\D/.test(value)) return;
			const n = Number.parseInt(value, 10);
			if (Number.isNaN(n) || n < 0) return;
			const max = field === "womenCount" ? maxWomen : maxMen;
			if (max !== undefined && n > max) {
				setValidationError(
					`Le nombre ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
				);
				return;
			}
			setValidationError(null);
			form.setValue(`categories.${formIndex}.${field}`, n);
		}
		setSaved(false);
	}

	const onSubmit = form.handleSubmit(() => {
		const allStepCategories = [...annualCategories, ...hourlyCategories];
		const incomplete = allStepCategories.some(
			(c) =>
				c.womenCount === undefined || c.menCount === undefined || !c.womenValue,
		);
		if (incomplete) {
			setFormValidationError(
				"Veuillez renseigner toutes les données avant de passer à l'étape suivante.",
			);
			return;
		}
		setFormValidationError(null);
		mutation.mutate({
			step: 4,
			categories: stepToFormCategories(annualCategories, hourlyCategories),
		});
	});

	return (
		<form className={stepStyles.formColumn} onSubmit={onSubmit}>
			<StepTitleRow
				onDevFill={() => {
					form.setValue(
						"categories",
						stepToFormCategories(DEV_STEP4_ANNUAL, DEV_STEP4_HOURLY),
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
					categories={annualCategories}
					maxMen={maxMen}
					maxWomen={maxWomen}
					onCategoryChange={(index, field, value) =>
						handleCategoryChange("annual", index, field, value)
					}
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={annualCategories}
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
					categories={hourlyCategories}
					maxMen={maxMen}
					maxWomen={maxWomen}
					onCategoryChange={(index, field, value) =>
						handleCategoryChange("hourly", index, field, value)
					}
					readingNote={
						gipPrefillData ? (
							<QuartileReadingNote
								categories={hourlyCategories}
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
					annualCategories={annualCategories}
					hourlyCategories={hourlyCategories}
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

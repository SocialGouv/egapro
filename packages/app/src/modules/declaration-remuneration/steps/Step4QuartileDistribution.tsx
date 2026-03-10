"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import { QUARTILE_NAMES } from "../shared/constants";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { normalizeDecimalInput } from "../shared/gapUtils";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { StepCategoryData } from "../types";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { QuartileTable } from "./step4/QuartileTable";

type Step4QuartileDistributionProps = {
	initialAnnualCategories?: StepCategoryData[];
	initialHourlyCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
};

export function Step4QuartileDistribution({
	initialAnnualCategories,
	initialHourlyCategories,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();

	const defaultCategories = () =>
		QUARTILE_NAMES.map((name) => ({ name })) as StepCategoryData[];

	const [annualCategories, setAnnualCategories] = useState<StepCategoryData[]>(
		initialAnnualCategories?.length
			? initialAnnualCategories
			: defaultCategories(),
	);

	const [hourlyCategories, setHourlyCategories] = useState<StepCategoryData[]>(
		initialHourlyCategories?.length
			? initialHourlyCategories
			: defaultCategories(),
	);

	const [validationError, setValidationError] = useState<string | null>(null);

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
	const [saved, setSaved] = useState(hasInitialData);
	const [formValidationError, setFormValidationError] = useState<string | null>(
		null,
	);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/5"),
	});

	function handleCategoryChange(
		tableType: "annual" | "hourly",
		index: number,
		field: "womenValue" | "womenCount" | "menCount",
		value: string,
	) {
		const setter =
			tableType === "annual" ? setAnnualCategories : setHourlyCategories;

		if (field === "womenValue") {
			const normalized = normalizeDecimalInput(value);
			if (normalized === null) return;
			if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
			setter((prev) =>
				prev.map((c, i) =>
					i === index ? { ...c, womenValue: normalized || undefined } : c,
				),
			);
		} else {
			if (value === "") {
				setter((prev) =>
					prev.map((c, i) => (i === index ? { ...c, [field]: undefined } : c)),
				);
				setValidationError(null);
				setSaved(false);
				return;
			}
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
			setter((prev) =>
				prev.map((c, i) => (i === index ? { ...c, [field]: n } : c)),
			);
		}
		setSaved(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const allCategories = [...annualCategories, ...hourlyCategories];
		const incomplete = allCategories.some(
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
			categories: [
				...annualCategories.map((c) => ({
					name: `annual:${c.name}`,
					womenCount: c.womenCount,
					menCount: c.menCount,
					womenValue: c.womenValue,
				})),
				...hourlyCategories.map((c) => ({
					name: `hourly:${c.name}`,
					womenCount: c.womenCount,
					menCount: c.menCount,
					womenValue: c.womenValue,
				})),
			],
		});
	}

	return (
		<form className={stepStyles.formColumn} onSubmit={handleSubmit}>
			{/* Title + save status */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			<StepIndicator currentStep={4} />

			{/* Description + instructions */}
			<div className={stepStyles.instructions}>
				<p className="fr-mb-0">
					Cet indicateur répartit l&apos;ensemble des salariés en quatre groupes
					de rémunération appelés quartiles : du quartile inférieur qui regroupe
					les salariés les moins rémunérés, au quartile supérieur qui rassemble
					les salariés les mieux rémunérés.
					<TooltipButton
						id="tooltip-step4-description"
						label="Information sur les quartiles"
					/>
				</p>

				<p className="fr-mb-0">
					<strong>
						Renseignez les informations avant de valider vos indicateurs.
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
					tableType="hourly"
					title="Rémunération horaire brute moyenne"
					validationError={validationError}
				/>

				<DefinitionAccordion
					id="accordion-step4"
					title="Définitions et méthode de calcul"
				/>
			</div>

			{formValidationError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{formValidationError}</p>
				</div>
			)}

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/3"
			/>
		</form>
	);
}

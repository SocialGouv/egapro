"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import stepStyles from "./Step4QuartileDistribution.module.scss";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { StepCategoryData } from "../types";
import { QuartileEditDialog } from "./step4/QuartileEditDialog";
import { QuartileTable } from "./step4/QuartileTable";

const QUARTILE_NAMES = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

type Step4QuartileDistributionProps = {
	initialAnnualCategories?: StepCategoryData[];
	initialHourlyCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
};

type EditMode = {
	field: "remuneration" | "womenCount" | "menCount";
	tableType: "annual" | "hourly";
} | null;

export function Step4QuartileDistribution({
	initialAnnualCategories,
	initialHourlyCategories,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);

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

	const [editMode, setEditMode] = useState<EditMode>(null);
	const [editValues, setEditValues] = useState<string[]>(["", "", "", ""]);
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

	function getCategories(tableType: "annual" | "hourly") {
		return tableType === "annual" ? annualCategories : hourlyCategories;
	}

	function openEditModal(
		field: "remuneration" | "womenCount" | "menCount",
		tableType: "annual" | "hourly",
	) {
		setEditMode({ field, tableType });
		setValidationError(null);
		const cats = getCategories(tableType);
		const values = cats.map((c) => {
			if (field === "remuneration") return c.womenValue ?? "";
			if (field === "womenCount") return c.womenCount?.toString() ?? "";
			return c.menCount?.toString() ?? "";
		});
		setEditValues(values);
		dialogRef.current?.showModal();
	}

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
		setEditMode(null);
	}, []);

	function handleValueChange(index: number) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (!editMode) return;

			if (editMode.field === "remuneration") {
				if (val === "" || Number.parseFloat(val) >= 0) {
					setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
				}
			} else {
				if (val === "") {
					setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
					setValidationError(null);
					return;
				}
				const n = Number.parseInt(val, 10);
				if (Number.isNaN(n) || n < 0) return;
				const max = editMode.field === "womenCount" ? maxWomen : maxMen;
				if (max !== undefined && n > max) {
					setValidationError(
						`Le nombre ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
					);
					return;
				}
				setValidationError(null);
				setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
			}
		};
	}

	function handleSaveEdit() {
		if (!editMode) return;
		const setter =
			editMode.tableType === "annual"
				? setAnnualCategories
				: setHourlyCategories;
		setter((prev) =>
			prev.map((c, i) => {
				if (editMode.field === "remuneration") {
					return { ...c, womenValue: editValues[i] || undefined };
				}
				if (editMode.field === "womenCount") {
					return {
						...c,
						womenCount: editValues[i]
							? Number.parseInt(editValues[i] as string, 10)
							: undefined,
					};
				}
				return {
					...c,
					menCount: editValues[i]
						? Number.parseInt(editValues[i] as string, 10)
						: undefined,
				};
			}),
		);
		setSaved(false);
		closeDialog();
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

	// 4th quartile percentage for interpretation callout (annual)
	const q4 = annualCategories[3];
	const q4Total = (q4?.womenCount ?? 0) + (q4?.menCount ?? 0);
	const q4WomenPct =
		q4Total > 0 ? ((q4?.womenCount ?? 0) / q4Total) * 100 : null;

	// Computed total for count dialogs
	const editTotal =
		editMode?.field !== "remuneration"
			? editValues.reduce(
					(sum, v) => sum + (v ? Number.parseInt(v, 10) || 0 : 0),
					0,
				)
			: 0;

	// Dialog labels
	const dialogTitle =
		editMode?.field === "remuneration"
			? "Modifier les données"
			: "Modifier les effectifs";
	const dialogSubtitle = editMode
		? editMode.field === "remuneration"
			? editMode.tableType === "annual"
				? "Rémunération annuelle brute moyenne"
				: "Rémunération horaire brute moyenne"
			: editMode.field === "womenCount"
				? "Nombre de femmes"
				: "Nombre d'hommes"
		: "";

	return (
		<form onSubmit={handleSubmit} className={stepStyles.formColumn}>
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
			<div className={common.flexColumnGap1}>
				<p className="fr-mb-0">
					Cet indicateur répartit l&apos;ensemble des salariés en quatre groupes
					de rémunération appelés quartiles : du quartile inférieur qui regroupe
					les salariés les moins rémunérés, au quartile supérieur qui rassemble
					les salariés les mieux rémunérés.
				</p>

				<p className={`fr-mb-0 ${common.fontMedium}`}>
					Vérifiez les informations préremplies et modifiez-les si elles sont
					incorrectes avant de valider vos indicateurs.
					<TooltipButton
						id="tooltip-step4-info"
						label="Information sur les indicateurs"
					/>
				</p>
			</div>

			{/* Table 1 - Annual remuneration */}
			<QuartileTable
				categories={annualCategories}
				onEditMenCount={() => openEditModal("menCount", "annual")}
				onEditRemuneration={() => openEditModal("remuneration", "annual")}
				onEditWomenCount={() => openEditModal("womenCount", "annual")}
				tableType="annual"
				title="Rémunération annuelle brute moyenne"
			/>

			{/* Table 2 - Hourly remuneration */}
			<QuartileTable
				categories={hourlyCategories}
				onEditMenCount={() => openEditModal("menCount", "hourly")}
				onEditRemuneration={() => openEditModal("remuneration", "hourly")}
				onEditWomenCount={() => openEditModal("womenCount", "hourly")}
				tableType="hourly"
				title="Rémunération horaire brute moyenne"
			/>

			<DefinitionAccordion id="accordion-step4" />

			{/* Interpretation callout */}
			<div className="fr-callout fr-callout--orange-terre-battue">
				<p className="fr-callout__text">
					<strong>Écart en défaveur des femmes :</strong> les femmes sont
					nettement moins présentes dans le quartile des plus hauts salaires
					{q4WomenPct !== null && (
						<> ({q4WomenPct.toFixed(1).replace(".", ",")} %)</>
					)}
					, alors qu&apos;elles sont proches de la parité dans les autres
					quartiles.
				</p>
				<p className="fr-callout__text">
					<strong>Interprétation des résultats :</strong> les femmes accèdent
					moins aux postes ou situations les mieux rémunérés, ce qui indique une
					inégalité d&apos;accès aux niveaux de salaire les plus élevés.
				</p>
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

			{/* Edit dialog */}
			<QuartileEditDialog
				dialogRef={dialogRef}
				dialogSubtitle={dialogSubtitle}
				dialogTitle={dialogTitle}
				editTotal={editTotal}
				editValues={editValues}
				isRemuneration={editMode?.field === "remuneration"}
				onClose={closeDialog}
				onSave={handleSaveEdit}
				onValueChange={handleValueChange}
				validationError={validationError}
			/>
		</form>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { api } from "~/trpc/react";
import { FormActions } from "../shared/FormActions";
import { StepIndicator } from "../shared/StepIndicator";
import common from "../shared/common.module.scss";
import { computeGap } from "../shared/gapUtils";
import type { PayGapRow, StepCategoryData, VariablePayData } from "../types";
import stepStyles from "./Step6Review.module.scss";
import { CardTitle } from "./step6/CardTitle";
import { GapColumn } from "./step6/GapColumn";
import { GapSideBySide } from "./step6/GapSideBySide";
import { QuartileColumn } from "./step6/QuartileColumn";
import { SubmitModal } from "./step6/SubmitModal";
import { parseStep5Categories } from "./step6/parseStep5Categories";

// -- Helper to extract gap from a row list --

function findGap(rows: PayGapRow[], label: string): number | null {
	const row = rows.find((r) => r.label === label);
	return row ? computeGap(row.womenValue, row.menValue) : null;
}

// -- Component --

type Props = {
	step2Rows?: PayGapRow[];
	step3Data?: VariablePayData;
	step4Categories?: StepCategoryData[];
	step5Categories?: StepCategoryData[];
	isSubmitted?: boolean;
};

export function Step6Review({
	step2Rows = [],
	step3Data,
	step4Categories = [],
	step5Categories = [],
	isSubmitted = false,
}: Props) {
	const currentYear = new Date().getFullYear();
	const router = useRouter();
	const modalRef = useRef<HTMLDialogElement>(null);
	const submitMutation = api.declaration.submit.useMutation({
		onSuccess: () => {
			router.push("/");
		},
	});

	const openModal = useCallback(() => {
		const el = modalRef.current;
		if (!el) return;
		const w = window as unknown as Record<string, unknown>;
		if (typeof w.dsfr === "function") {
			(w.dsfr as (el: HTMLElement) => { modal: { disclose: () => void } })(
				el,
			).modal.disclose();
		}
	}, []);

	const closeModal = useCallback(() => {
		const el = modalRef.current;
		if (!el) return;
		const w = window as unknown as Record<string, unknown>;
		if (typeof w.dsfr === "function") {
			(w.dsfr as (el: HTMLElement) => { modal: { conceal: () => void } })(
				el,
			).modal.conceal();
		}
	}, []);

	// Parse step 2 gaps
	const annualMeanGap = findGap(step2Rows, "Annuelle brute moyenne");
	const hourlyMeanGap = findGap(step2Rows, "Horaire brute moyenne");
	const annualMedianGap = findGap(step2Rows, "Annuelle brute médiane");
	const hourlyMedianGap = findGap(step2Rows, "Horaire brute médiane");

	// Parse step 3 gaps
	const step3Rows = step3Data?.rows ?? [];
	const step3AnnualMeanGap = findGap(step3Rows, "Annuelle brute moyenne");
	const step3AnnualMedianGap = findGap(step3Rows, "Annuelle brute médiane");
	const step3HourlyMeanGap = findGap(step3Rows, "Horaire brute moyenne");
	const step3HourlyMedianGap = findGap(step3Rows, "Horaire brute médiane");

	// Parse step 4 quartile data
	const annualQuartiles = step4Categories.filter((c) =>
		c.name.startsWith("annual:"),
	);
	const hourlyQuartiles = step4Categories.filter((c) =>
		c.name.startsWith("hourly:"),
	);

	// Parse step 5 categories
	const step5Parsed = parseStep5Categories(step5Categories);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!isSubmitted) {
			openModal();
		}
	}

	return (
		<form onSubmit={handleSubmit} className={common.flexColumnGap2}>
			<h1 className="fr-h4 fr-mb-0">
				Déclaration des indicateurs de rémunération {currentYear}
			</h1>

			<StepIndicator currentStep={6} />

			<p className={`fr-mb-0 ${common.mentionGrey}`}>
				Vérifiez que toutes les informations ont été complétées avant de
				soumettre votre déclaration aux services du ministère chargé du travail.
			</p>

			{/* Card 1: Pay gap (Step 2) */}
			<div className={stepStyles.card}>
				<CardTitle>Écart de rémunération</CardTitle>
				{step2Rows.length > 0 ? (
					<GapSideBySide
						annualMeanGap={annualMeanGap}
						annualMedianGap={annualMedianGap}
						hourlyMeanGap={hourlyMeanGap}
						hourlyMedianGap={hourlyMedianGap}
					/>
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 2: Variable pay (Step 3) */}
			<div className={stepStyles.card}>
				<CardTitle>Écart de rémunération variable ou complémentaire</CardTitle>
				{step3Data?.rows && step3Data.rows.length > 0 ? (
					<>
						<GapSideBySide
							annualMeanGap={step3AnnualMeanGap}
							annualMedianGap={step3AnnualMedianGap}
							hourlyMeanGap={step3HourlyMeanGap}
							hourlyMedianGap={step3HourlyMedianGap}
						/>
						<div className={stepStyles.sideBySide}>
							<div className={stepStyles.column}>
								<p className="fr-text--bold fr-text--sm fr-mb-0">Proportion</p>
								<div className={stepStyles.subSection}>
									<div className={stepStyles.flex1}>
										<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
											Femmes
										</p>
										<strong>
											{step3Data.beneficiaryWomen
												? `${step3Data.beneficiaryWomen} %`
												: "-"}
										</strong>
									</div>
									<div className={stepStyles.flex1}>
										<p className={`fr-text--xs fr-mb-0 ${common.mentionGrey}`}>
											Hommes
										</p>
										<strong>
											{step3Data.beneficiaryMen
												? `${step3Data.beneficiaryMen} %`
												: "-"}
										</strong>
									</div>
								</div>
							</div>
							<div className={stepStyles.verticalSeparator} />
							<div className={stepStyles.column} />
						</div>
					</>
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 3: Quartile distribution (Step 4) */}
			<div className={stepStyles.card}>
				<CardTitle tooltipId="tooltip-quartile">
					Proportion de femmes et d&apos;hommes dans chaque quartile salarial
				</CardTitle>
				{annualQuartiles.length > 0 || hourlyQuartiles.length > 0 ? (
					<>
						{annualQuartiles.length > 0 && (
							<QuartileColumn
								title="Rémunération annuelle brute moyenne"
								quartiles={annualQuartiles.map((q) => ({
									label: q.name.replace("annual:", ""),
									womenCount: q.womenCount ?? 0,
									menCount: q.menCount ?? 0,
								}))}
							/>
						)}
						{hourlyQuartiles.length > 0 && (
							<QuartileColumn
								title="Rémunération horaire brute moyenne"
								quartiles={hourlyQuartiles.map((q) => ({
									label: q.name.replace("hourly:", ""),
									womenCount: q.womenCount ?? 0,
									menCount: q.menCount ?? 0,
								}))}
							/>
						)}
					</>
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{/* Card 4: Employee categories (Step 5) */}
			<div className={stepStyles.card}>
				<CardTitle tooltipId="tooltip-categories">
					Écart de rémunération par catégories de salariés
				</CardTitle>
				{step5Parsed.length > 0 ? (
					step5Parsed.map((cat) => (
						<div key={cat.index}>
							<p className="fr-text--bold fr-mb-0">{cat.name}</p>
							<div className={stepStyles.sideBySide}>
								<GapColumn
									columns={[
										{ label: "Salaire de base", gap: cat.annualBaseGap },
										{
											label: "Composantes variables",
											gap: cat.annualVariableGap,
										},
									]}
									title="Annuelle brute"
								/>
								<div className={stepStyles.verticalSeparator} />
								<GapColumn
									columns={[
										{ label: "Salaire de base", gap: cat.hourlyBaseGap },
										{
											label: "Composantes variables",
											gap: cat.hourlyVariableGap,
										},
									]}
									title="Horaire brute"
								/>
							</div>
						</div>
					))
				) : (
					<p className={`fr-mb-0 ${common.mentionGrey}`}>
						Aucune donnée renseignée.
					</p>
				)}
			</div>

			{isSubmitted ? (
				<FormActions nextHref="/" nextLabel="Suivant" previousHref="/" />
			) : (
				<FormActions
					nextLabel="Suivant"
					previousHref="/declaration-remuneration/etape/5"
				/>
			)}

			{!isSubmitted && (
				<SubmitModal
					modalRef={modalRef}
					onClose={closeModal}
					onSubmit={() => submitMutation.mutate()}
					isPending={submitMutation.isPending}
				/>
			)}
		</form>
	);
}

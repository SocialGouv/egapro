"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import type { CategoryData } from "../types";
import { DEFAULT_CATEGORIES } from "../types";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";

interface Step1WorkforceProps {
	initialCategories?: CategoryData[];
}

export function Step1Workforce({ initialCategories }: Step1WorkforceProps) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);

	const [categories, setCategories] = useState<CategoryData[]>(
		initialCategories?.length
			? initialCategories
			: DEFAULT_CATEGORIES.map((name) => ({ name, women: 0, men: 0 })),
	);

	// Temporary state for the edit modal
	const [editWomen, setEditWomen] = useState(0);
	const [editMen, setEditMen] = useState(0);

	const totalWomen = categories.reduce((sum, c) => sum + c.women, 0);
	const totalMen = categories.reduce((sum, c) => sum + c.men, 0);
	const total = totalWomen + totalMen;

	const hasInitialData =
		initialCategories?.some((c) => c.women > 0 || c.men > 0) ?? false;
	const [saved, setSaved] = useState(hasInitialData);

	const mutation = api.declaration.updateStep1.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/2"),
	});

	function openEditModal() {
		setEditWomen(totalWomen);
		setEditMen(totalMen);
		dialogRef.current?.showModal();
	}

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	function handleSaveEdit() {
		// For now, store as a single "Nombre de salariés" row
		setCategories([
			{
				name: "Nombre de salariés",
				women: Math.max(0, editWomen),
				men: Math.max(0, editMen),
			},
		]);
		setSaved(false);
		closeDialog();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		mutation.mutate({ categories });
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-3w">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclarer les indicateurs pour l'ensemble des salariés et par
						catégorie salariés
					</h1>
				</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			<StepIndicator currentStep={1} />

			<p className="fr-text--lg fr-mb-3w">
				Renseignez l'effectif physique de votre entreprise.
			</p>

			{/* Read-only table with edit button */}
			<div className="fr-table fr-table--no-caption fr-mb-1w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>
									Effectifs physiques pris en compte pour le calcul des
									indicateurs
								</caption>
								<thead>
									<tr>
										<th scope="col">{/* vide */}</th>
										<th scope="col">Femmes</th>
										<th scope="col">Hommes</th>
										<th scope="col">Total</th>
										<th scope="col">{/* actions */}</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<strong>Nombre de salariés</strong>
										</td>
										<td>{totalWomen}</td>
										<td>{totalMen}</td>
										<td>
											<strong>{total}</strong>
										</td>
										<td>
											<button
												aria-label="Modifier les effectifs"
												className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
												onClick={openEditModal}
												type="button"
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<p
				className="fr-text--sm fr-mb-4w"
				style={{ color: "var(--text-mention-grey)" }}
			>
				Source : déclarations sociales nominatives mise à jour le 27/01/2026.
				<TooltipButton id="tooltip-source" label="Information sur la source" />
			</p>

			<DefinitionAccordion id="accordion-step1" />

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-2w">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration"
			/>

			{/* Edit modal */}
			<dialog
				aria-labelledby="edit-effectifs-title"
				className="fr-p-4w"
				ref={dialogRef}
				style={{
					maxWidth: "36rem",
					borderRadius: "0.25rem",
					border: "none",
					boxShadow: "0 6px 18px 0 rgba(0, 0, 18, 0.16)",
				}}
			>
				<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
					<button
						aria-label="Fermer"
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
						onClick={closeDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="edit-effectifs-title">
					Modifier les effectifs physiques pris en compte pour le calcul des
					indicateurs
				</h2>

				<div className="fr-callout fr-callout--orange-terre-battue fr-mb-3w">
					<p className="fr-callout__text">
						Tout changement d'effectif réinitialise les indicateurs préremplis,
						qui devront alors être saisis. En cas de modification, veuillez
						mettre à jour votre DSN afin de garantir la cohérence des
						informations.
					</p>
				</div>

				<p className="fr-text--bold fr-mb-1v">Nombre de salariées</p>
				<p
					className="fr-text--sm fr-mb-3w"
					style={{ color: "var(--text-mention-grey)" }}
				>
					Tous les champs sont obligatoires
				</p>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-women">
						Femmes
					</label>
					<input
						className="fr-input"
						id="edit-women"
						min={0}
						onChange={(e) =>
							setEditWomen(
								Math.max(0, Number.parseInt(e.target.value, 10) || 0),
							)
						}
						type="number"
						value={editWomen}
					/>
				</div>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-men">
						Hommes
					</label>
					<input
						className="fr-input"
						id="edit-men"
						min={0}
						onChange={(e) =>
							setEditMen(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
						}
						type="number"
						value={editMen}
					/>
				</div>

				<div className="fr-input-group fr-mb-3w">
					<p className="fr-label" id="edit-total-label">
						Total
					</p>
					<output
						className="fr-p-1w fr-text--bold"
						htmlFor="edit-women edit-men"
					>
						{editWomen + editMen}
					</output>
				</div>

				<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
					<li>
						<button
							className="fr-btn fr-btn--secondary"
							onClick={closeDialog}
							type="button"
						>
							Annuler
						</button>
					</li>
					<li>
						<button className="fr-btn" onClick={handleSaveEdit} type="button">
							Enregistrer
						</button>
					</li>
				</ul>
			</dialog>
		</form>
	);
}

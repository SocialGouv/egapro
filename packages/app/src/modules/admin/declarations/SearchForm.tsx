"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";

import type { SearchDeclarationsFormValues } from "./schemas";
import { searchDeclarationsFormSchema } from "./schemas";

export function SearchForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { register, handleSubmit, reset } = useZodForm(
		searchDeclarationsFormSchema,
		{
			defaultValues: {
				query: searchParams.get("query") ?? "",
				email: searchParams.get("email") ?? "",
				year: searchParams.get("year") ?? "",
				dateFrom: searchParams.get("dateFrom") ?? "",
				dateTo: searchParams.get("dateTo") ?? "",
				status:
					(searchParams.get("status") as
						| ""
						| "draft"
						| "awaiting_compliance_path_choice"
						| "corrective_actions_chosen"
						| "joint_evaluation_chosen"
						| "awaiting_revision_choice"
						| "revised_joint_evaluation_chosen"
						| "awaiting_cse_opinion"
						| "demarche_completed"
						| "cancelled") ?? "",
			},
		},
	);

	const onSubmit = useCallback(
		(data: SearchDeclarationsFormValues) => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== "") {
					params.set(key, String(value));
				}
			}
			params.set("page", "1");
			router.push(`/admin/declarations?${params.toString()}`);
		},
		[router],
	);

	const handleReset = useCallback(() => {
		reset({
			query: "",
			email: "",
			year: "",
			dateFrom: "",
			dateTo: "",
			status: "",
		});
		router.push("/admin/declarations");
	}, [reset, router]);

	return (
		<form
			autoComplete="off"
			className="fr-mb-4w"
			onSubmit={handleSubmit(onSubmit)}
		>
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-query">
							SIREN / Nom entreprise
						</label>
						<input
							className="fr-input"
							id="search-query"
							type="text"
							{...register("query")}
						/>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-email">
							Email déclarant
						</label>
						<input
							className="fr-input"
							id="search-email"
							type="email"
							{...register("email")}
						/>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-year">
							Année
						</label>
						<input
							className="fr-input"
							id="search-year"
							type="number"
							{...register("year")}
						/>
					</div>
				</div>
			</div>
			<div className="fr-grid-row fr-grid-row--gutters fr-mt-1w">
				<div className="fr-col-12 fr-col-md-3">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-date-from">
							Date de dépôt (du)
						</label>
						<input
							className="fr-input"
							id="search-date-from"
							type="date"
							{...register("dateFrom")}
						/>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-3">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-date-to">
							Date de dépôt (au)
						</label>
						<input
							className="fr-input"
							id="search-date-to"
							type="date"
							{...register("dateTo")}
						/>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-3">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-status">
							Statut
						</label>
						<select
							className="fr-select"
							id="search-status"
							{...register("status")}
						>
							<option value="">Tous</option>
							<option value="draft">Brouillon</option>
							<option value="cancelled">Annulée</option>
						</select>
					</div>
				</div>
			</div>
			<div className="fr-grid-row fr-grid-row--right fr-mt-2w">
				<ul className="fr-btns-group fr-btns-group--inline">
					<li>
						<button
							className="fr-btn fr-btn--secondary"
							onClick={handleReset}
							type="button"
						>
							Réinitialiser
						</button>
					</li>
					<li>
						<button className="fr-btn" type="submit">
							Rechercher
						</button>
					</li>
				</ul>
			</div>
		</form>
	);
}

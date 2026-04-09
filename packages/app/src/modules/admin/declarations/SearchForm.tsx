"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import type { SearchDeclarationsInput } from "./schemas";

export function SearchForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { register, handleSubmit, reset } = useForm<SearchDeclarationsInput>({
		defaultValues: {
			query: searchParams.get("query") ?? "",
			email: searchParams.get("email") ?? "",
			year: searchParams.get("year") ?? undefined,
			dateFrom: searchParams.get("dateFrom") ?? "",
			dateTo: searchParams.get("dateTo") ?? "",
			status:
				(searchParams.get("status") as "draft" | "submitted") ?? undefined,
			index: searchParams.get("index") ?? undefined,
			indexOperator:
				(searchParams.get("indexOperator") as "gt" | "lt" | "eq") ?? undefined,
		},
	});

	const onSubmit = useCallback(
		(data: SearchDeclarationsInput) => {
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
			year: undefined,
			dateFrom: "",
			dateTo: "",
			status: undefined,
			index: undefined,
			indexOperator: undefined,
		});
		router.push("/admin/declarations");
	}, [reset, router]);

	return (
		<form className="fr-mb-4w" onSubmit={handleSubmit(onSubmit)}>
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
							<option value="submitted">Transmise</option>
						</select>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-3">
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-6">
							<div className="fr-select-group">
								<label className="fr-label" htmlFor="search-index-op">
									Index
								</label>
								<select
									className="fr-select"
									id="search-index-op"
									{...register("indexOperator")}
								>
									<option value="">—</option>
									<option value="eq">=</option>
									<option value="gt">&ge;</option>
									<option value="lt">&le;</option>
								</select>
							</div>
						</div>
						<div className="fr-col-6">
							<div className="fr-input-group">
								<label className="fr-label" htmlFor="search-index">
									Valeur
								</label>
								<input
									className="fr-input"
									id="search-index"
									max={100}
									min={0}
									type="number"
									{...register("index")}
								/>
							</div>
						</div>
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

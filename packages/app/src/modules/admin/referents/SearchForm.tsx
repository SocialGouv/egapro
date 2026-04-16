"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "~/modules/domain";
import { useZodForm } from "~/modules/shared";

import type { SearchReferentsFormValues } from "./schemas";
import { searchReferentsFormSchema } from "./schemas";

const sortedRegions = (Object.entries(REGIONS) as [RegionCode, string][]).sort(
	(a, b) => a[1].localeCompare(b[1], "fr"),
);

export function SearchForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { register, handleSubmit, reset, watch } = useZodForm(
		searchReferentsFormSchema,
		{
			defaultValues: {
				query: searchParams.get("query") ?? "",
				region: searchParams.get("region") ?? "",
				county: searchParams.get("county") ?? "",
			},
		},
	);

	const selectedRegion = watch("region") as RegionCode | "" | undefined;
	const countyOptions = selectedRegion
		? REGIONS_TO_COUNTIES[selectedRegion as RegionCode]
		: [];

	const onSubmit = useCallback(
		(data: SearchReferentsFormValues) => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== "") {
					params.set(key, String(value));
				}
			}
			params.set("page", "1");
			router.push(`/admin/liste-referents?${params.toString()}`);
		},
		[router],
	);

	const handleReset = useCallback(() => {
		reset({ query: "", region: "", county: "" });
		router.push("/admin/liste-referents");
	}, [reset, router]);

	return (
		<form className="fr-mb-4w" onSubmit={handleSubmit(onSubmit)}>
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-input-group">
						<label className="fr-label" htmlFor="search-query">
							Nom du référent
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
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-region">
							Région
						</label>
						<select
							className="fr-select"
							id="search-region"
							{...register("region")}
						>
							<option value="">Toutes</option>
							{sortedRegions.map(([code, name]) => (
								<option key={code} value={code}>
									{name}
								</option>
							))}
						</select>
					</div>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<div className="fr-select-group">
						<label className="fr-label" htmlFor="search-county">
							Département
						</label>
						<select
							className="fr-select"
							disabled={!selectedRegion}
							id="search-county"
							{...register("county")}
						>
							<option value="">
								{selectedRegion ? "Tous" : "Choisir une région d'abord"}
							</option>
							{countyOptions?.map((code) => (
								<option key={code} value={code}>
									{COUNTIES[code]} ({code})
								</option>
							))}
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

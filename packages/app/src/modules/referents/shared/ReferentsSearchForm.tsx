"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "~/modules/domain";
import {
	type ReferentsSearchFormSchema,
	useReferentsSearchForm,
} from "./useReferentsSearchForm";

const sortedRegions = (Object.entries(REGIONS) as [RegionCode, string][]).sort(
	(a, b) => a[1].localeCompare(b[1], "fr"),
);

type Props = {
	basePath: string;
	schema: ReferentsSearchFormSchema;
	fieldPrefix: string;
	emptyRegionLabel?: string;
	emptyCountyLabel?: string;
	wrapFieldsInFieldset?: boolean;
};

/**
 * Shared referent search form. The admin and public pages differ in layout
 * details but share the schema (region + county), URL-state handling and
 * the region → county cascade.
 */
export function ReferentsSearchForm({
	basePath,
	schema,
	fieldPrefix,
	emptyRegionLabel = "Toutes les régions",
	emptyCountyLabel = "Tous les départements",
	wrapFieldsInFieldset = false,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { register, handleSubmit, reset, watch } = useReferentsSearchForm(
		schema,
		{
			region: searchParams.get("region") ?? "",
			county: searchParams.get("county") ?? "",
		},
	);

	const selectedRegion = watch("region") as RegionCode | "" | undefined;
	const countyOptions = selectedRegion
		? REGIONS_TO_COUNTIES[selectedRegion as RegionCode]
		: [];

	const onSubmit = useCallback(
		(data: Record<string, unknown>) => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== "") {
					params.set(key, String(value));
				}
			}
			params.set("page", "1");
			router.push(`${basePath}?${params.toString()}`);
		},
		[basePath, router],
	);

	const handleReset = useCallback(() => {
		reset({ region: "", county: "" });
		router.push(basePath);
	}, [basePath, reset, router]);

	const regionField = (
		<div className="fr-col-12 fr-col-md-6">
			<div className="fr-select-group">
				<label className="fr-label" htmlFor={`${fieldPrefix}-region`}>
					Région
				</label>
				<select
					className="fr-select"
					id={`${fieldPrefix}-region`}
					{...register("region")}
				>
					<option value="">{emptyRegionLabel}</option>
					{sortedRegions.map(([code, name]) => (
						<option key={code} value={code}>
							{name}
						</option>
					))}
				</select>
			</div>
		</div>
	);

	const countyField = (
		<div className="fr-col-12 fr-col-md-6">
			<div className="fr-select-group">
				<label className="fr-label" htmlFor={`${fieldPrefix}-county`}>
					Département
				</label>
				<select
					className="fr-select"
					disabled={!selectedRegion}
					id={`${fieldPrefix}-county`}
					{...register("county")}
				>
					<option value="">
						{selectedRegion ? emptyCountyLabel : "Choisir une région d'abord"}
					</option>
					{countyOptions?.map((code) => (
						<option key={code} value={code}>
							{COUNTIES[code]} ({code})
						</option>
					))}
				</select>
			</div>
		</div>
	);

	const gridBody = (
		<div className="fr-grid-row fr-grid-row--gutters">
			{regionField}
			{countyField}
		</div>
	);

	return (
		<form className="fr-mb-4w" onSubmit={handleSubmit(onSubmit)}>
			{wrapFieldsInFieldset ? (
				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend fr-sr-only">
						Rechercher un référent
					</legend>
					{gridBody}
				</fieldset>
			) : (
				gridBody
			)}
			<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-2w">
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
		</form>
	);
}

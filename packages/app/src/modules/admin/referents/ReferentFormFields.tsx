"use client";

import type {
	FieldErrors,
	UseFormRegister,
	UseFormWatch,
} from "react-hook-form";
import type { CountyCode, RegionCode } from "~/modules/domain";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "~/modules/domain";

import type { ReferentFormValues } from "./schemas";

type Props = {
	modalId: string;
	register: UseFormRegister<ReferentFormValues>;
	watch: UseFormWatch<ReferentFormValues>;
	errors: FieldErrors<ReferentFormValues>;
};

const sortedRegions = (Object.entries(REGIONS) as [RegionCode, string][]).sort(
	(a, b) => a[1].localeCompare(b[1], "fr"),
);

export function ReferentFormFields({
	modalId,
	register,
	watch,
	errors,
}: Props) {
	const selectedRegion = watch("region") as RegionCode | "";
	const selectedType = watch("type");
	const countyOptions = selectedRegion
		? REGIONS_TO_COUNTIES[selectedRegion as RegionCode]
		: [];

	return (
		<>
			<div className="fr-checkbox-group fr-mb-3w">
				<input
					id={`${modalId}-principal`}
					type="checkbox"
					{...register("principal")}
				/>
				<label className="fr-label" htmlFor={`${modalId}-principal`}>
					Principal
				</label>
			</div>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor={`${modalId}-name`}>
					Nom
					<span className="fr-hint-text">
						Format : &quot;Prénom NOM&quot; ou &quot;Nom du service&quot;
					</span>
				</label>
				<input
					className={`fr-input ${errors.name ? "fr-input--error" : ""}`}
					id={`${modalId}-name`}
					type="text"
					{...register("name")}
				/>
				{errors.name && <p className="fr-error-text">{errors.name.message}</p>}
			</div>

			<div className="fr-select-group fr-mb-3w">
				<label className="fr-label" htmlFor={`${modalId}-region`}>
					Région
				</label>
				<select
					className={`fr-select ${errors.region ? "fr-select--error" : ""}`}
					id={`${modalId}-region`}
					{...register("region")}
				>
					<option value="">Sélectionner une région</option>
					{sortedRegions.map(([code, name]) => (
						<option key={code} value={code}>
							{name} ({code})
						</option>
					))}
				</select>
				{errors.region && (
					<p className="fr-error-text">{errors.region.message}</p>
				)}
			</div>

			<div className="fr-select-group fr-mb-3w">
				<label className="fr-label" htmlFor={`${modalId}-county`}>
					Département
					<span className="fr-hint-text">
						Non obligatoire (ex : coordination régionale)
					</span>
				</label>
				<select
					className="fr-select"
					disabled={!selectedRegion}
					id={`${modalId}-county`}
					{...register("county")}
				>
					<option value="">
						{selectedRegion ? "Département" : "Choisir une région d'abord"}
					</option>
					{countyOptions?.map((code) => (
						<option key={code} value={code}>
							{COUNTIES[code]} ({code})
						</option>
					))}
				</select>
			</div>

			<fieldset className="fr-fieldset fr-mb-3w">
				<legend className="fr-fieldset__legend">Type de la valeur</legend>
				<div className="fr-fieldset__content">
					<div className="fr-radio-group">
						<input
							id={`${modalId}-type-email`}
							type="radio"
							value="email"
							{...register("type")}
						/>
						<label className="fr-label" htmlFor={`${modalId}-type-email`}>
							Email
						</label>
					</div>
					<div className="fr-radio-group">
						<input
							id={`${modalId}-type-url`}
							type="radio"
							value="url"
							{...register("type")}
						/>
						<label className="fr-label" htmlFor={`${modalId}-type-url`}>
							URL
						</label>
					</div>
				</div>
			</fieldset>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor={`${modalId}-value`}>
					Valeur
					<span className="fr-hint-text">
						{selectedType === "url" ? "https://site.gouv.fr" : "email@gouv.fr"}
					</span>
				</label>
				<input
					className={`fr-input ${errors.value ? "fr-input--error" : ""}`}
					id={`${modalId}-value`}
					type={selectedType === "url" ? "url" : "email"}
					{...register("value")}
				/>
				{errors.value && (
					<p className="fr-error-text">{errors.value.message}</p>
				)}
			</div>

			<fieldset className="fr-fieldset fr-mb-3w">
				<legend className="fr-fieldset__legend">
					Suppléant
					<span className="fr-hint-text">Non obligatoire</span>
				</legend>
				<div className="fr-fieldset__content">
					<div className="fr-input-group fr-mb-2w">
						<label className="fr-label" htmlFor={`${modalId}-sub-name`}>
							Nom du suppléant
						</label>
						<input
							className="fr-input"
							id={`${modalId}-sub-name`}
							type="text"
							{...register("substituteName")}
						/>
					</div>
					<div className="fr-input-group">
						<label className="fr-label" htmlFor={`${modalId}-sub-email`}>
							Email du suppléant
						</label>
						<input
							className={`fr-input ${errors.substituteEmail ? "fr-input--error" : ""}`}
							id={`${modalId}-sub-email`}
							type="email"
							{...register("substituteEmail")}
						/>
						{errors.substituteEmail && (
							<p className="fr-error-text">{errors.substituteEmail.message}</p>
						)}
					</div>
				</div>
			</fieldset>
		</>
	);
}

"use client";

import { useEffect, useState } from "react";

import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import {
	type RepresentationCampaignFormInput,
	representationCampaignFormSchema,
} from "./schemas";

type Props = {
	initialYear: number;
};

type DateFieldKey = Exclude<keyof RepresentationCampaignFormInput, "year">;

const DATE_FIELDS: readonly DateFieldKey[] = [
	"campaignStartDate",
	"campaignEndDate",
	"declarationDeadline",
];

const FIELD_LABELS: Record<DateFieldKey, string> = {
	campaignStartDate: "Date de démarrage de la campagne",
	campaignEndDate: "Date de clôture de la campagne",
	declarationDeadline: "Date limite de déclaration",
};

export function RepresentationCampaignForm({ initialYear }: Props) {
	const [selectedYear, setSelectedYear] = useState<number>(initialYear);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const utils = api.useUtils();
	const campaignQuery =
		api.adminSettings.getRepresentationCampaignByYear.useQuery(
			{ year: selectedYear },
			{ staleTime: 0 },
		);

	const form = useZodForm(representationCampaignFormSchema, {
		defaultValues: buildDefaults(selectedYear),
	});

	useEffect(() => {
		if (!campaignQuery.data) return;
		form.reset({
			year: selectedYear,
			campaignStartDate: campaignQuery.data.campaignStartDate,
			campaignEndDate: campaignQuery.data.campaignEndDate,
			declarationDeadline: campaignQuery.data.declarationDeadline,
		});
	}, [campaignQuery.data, form, selectedYear]);

	const mutation = api.adminSettings.upsertRepresentationCampaign.useMutation({
		onSuccess: async () => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getRepresentationCampaignByYear.invalidate({
				year: selectedYear,
			});
		},
		onError: (err) => {
			setStatus("error");
			setServerError(err.message);
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		setStatus("idle");
		mutation.mutate(values);
	});

	const yearOptions = buildYearOptions();
	const isDefault = campaignQuery.data?.isDefault ?? false;

	return (
		<>
			<div className="fr-select-group fr-mb-3w">
				<label
					className="fr-label"
					htmlFor="representation-campaign-year-selector"
				>
					Sélectionnez l'année de campagne à modifier
					<span className="fr-hint-text">
						Choisissez une année dans la liste. Les champs ci-dessous
						correspondent à l'année sélectionnée.
					</span>
				</label>
				<select
					className="fr-select"
					id="representation-campaign-year-selector"
					onChange={(e) => setSelectedYear(Number(e.target.value))}
					value={selectedYear}
				>
					{yearOptions.map((year) => (
						<option key={year} value={year}>
							{year}
						</option>
					))}
				</select>
			</div>

			<form autoComplete="off" noValidate onSubmit={onSubmit}>
				<input
					type="hidden"
					{...form.register("year", { valueAsNumber: true })}
				/>

				<div className="fr-p-3w fr-background-alt--grey">
					<p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
						Paramètres applicables à la campagne <strong>{selectedYear}</strong>
						.
					</p>

					{isDefault && (
						<p className="fr-badge fr-badge--info fr-mb-2w">
							Valeurs par défaut — aucune surcharge enregistrée pour cette année
						</p>
					)}

					<fieldset className="fr-fieldset">
						<legend className="fr-fieldset__legend">
							Campagne représentation équilibrée
						</legend>
						<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
							{DATE_FIELDS.map((key) => (
								<div className="fr-col-12 fr-col-md-4" key={key}>
									<DateField
										error={form.formState.errors[key]?.message}
										fieldKey={key}
										register={form.register(key)}
									/>
								</div>
							))}
						</div>
					</fieldset>
				</div>

				{status === "success" && (
					<div
						aria-live="polite"
						className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
					>
						<p>
							Campagne représentation équilibrée enregistrée pour {selectedYear}
							.
						</p>
					</div>
				)}
				{status === "error" && serverError && (
					<div className="fr-alert fr-alert--error fr-mt-2w" role="alert">
						<p>{serverError}</p>
					</div>
				)}

				<ul className="fr-btns-group fr-btns-group--inline-sm fr-mt-2w">
					<li>
						<button
							className="fr-btn"
							disabled={mutation.isPending || campaignQuery.isLoading}
							type="submit"
						>
							{mutation.isPending ? "Enregistrement…" : "Enregistrer"}
						</button>
					</li>
				</ul>
			</form>
		</>
	);
}

type DateFieldProps = {
	fieldKey: DateFieldKey;
	register: ReturnType<
		ReturnType<typeof useZodForm<RepresentationCampaignFormInput>>["register"]
	>;
	error: string | undefined;
};

function DateField({ fieldKey, register, error }: DateFieldProps) {
	const id = `representation-settings-${fieldKey}`;
	return (
		<div
			className={
				error ? "fr-input-group fr-input-group--error" : "fr-input-group"
			}
		>
			<label className="fr-label" htmlFor={id}>
				{FIELD_LABELS[fieldKey]}
			</label>
			<input
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={Boolean(error)}
				className="fr-input"
				id={id}
				required
				type="date"
				{...register}
			/>
			{error && (
				<p className="fr-error-text" id={`${id}-error`}>
					{error}
				</p>
			)}
		</div>
	);
}

function buildDefaults(year: number): RepresentationCampaignFormInput {
	return {
		year,
		campaignStartDate: "",
		campaignEndDate: "",
		declarationDeadline: "",
	};
}

function buildYearOptions(): number[] {
	const max = getCurrentYear() + 10;
	const years: number[] = [];
	for (let y = FIRST_DECLARATION_YEAR; y <= max; y++) {
		years.push(y);
	}
	return years;
}

"use client";

import { useEffect, useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import {
	type CampaignDeadlinesFormInput,
	campaignDeadlinesFormSchema,
} from "./schemas";

type Props = {
	initialYear: number;
	configuredYears: number[];
};

type DateFieldKey = Exclude<keyof CampaignDeadlinesFormInput, "year">;

const OPTIONAL_FIELDS: readonly DateFieldKey[] = [
	"gipPublicationDate",
	"campaignStartDate",
];

const DECL1_FIELDS: readonly DateFieldKey[] = [
	"decl1ModificationDeadline",
	"decl1JustificationDeadline",
	"decl1JointEvaluationDeadline",
];

const DECL2_FIELDS: readonly DateFieldKey[] = [
	"decl2ModificationDeadline",
	"decl2JustificationDeadline",
	"decl2JointEvaluationDeadline",
];

const FIELD_LABELS: Record<DateFieldKey, string> = {
	gipPublicationDate: "Date de publication des données GIP",
	campaignStartDate: "Date de démarrage de la campagne",
	decl1ModificationDeadline: "Date limite de modification",
	decl1JustificationDeadline: "Date limite de justification",
	decl1JointEvaluationDeadline: "Date limite de l'avis du CSE",
	decl2ModificationDeadline: "Date limite de modification",
	decl2JustificationDeadline: "Date limite de justification",
	decl2JointEvaluationDeadline: "Date limite de l'avis du CSE",
};

/**
 * Edits all campaign deadlines for a given year. The year selector lets the
 * admin switch between already-configured years or start a new one.
 */
export function CampaignDeadlinesForm({ initialYear, configuredYears }: Props) {
	const [selectedYear, setSelectedYear] = useState<number>(initialYear);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const utils = api.useUtils();
	const deadlinesQuery = api.adminSettings.getDeadlinesByYear.useQuery(
		{ year: selectedYear },
		{ staleTime: 0 },
	);

	const form = useZodForm(campaignDeadlinesFormSchema, {
		defaultValues: buildDefaults(selectedYear),
	});

	useEffect(() => {
		if (!deadlinesQuery.data) return;
		form.reset({
			year: selectedYear,
			gipPublicationDate: deadlinesQuery.data.gipPublicationDate ?? "",
			campaignStartDate: deadlinesQuery.data.campaignStartDate ?? "",
			decl1ModificationDeadline: deadlinesQuery.data.decl1ModificationDeadline,
			decl1JustificationDeadline:
				deadlinesQuery.data.decl1JustificationDeadline,
			decl1JointEvaluationDeadline:
				deadlinesQuery.data.decl1JointEvaluationDeadline,
			decl2ModificationDeadline: deadlinesQuery.data.decl2ModificationDeadline,
			decl2JustificationDeadline:
				deadlinesQuery.data.decl2JustificationDeadline,
			decl2JointEvaluationDeadline:
				deadlinesQuery.data.decl2JointEvaluationDeadline,
		});
	}, [deadlinesQuery.data, form, selectedYear]);

	const mutation = api.adminSettings.upsertCampaignDeadlines.useMutation({
		onSuccess: async () => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getDeadlinesByYear.invalidate({
				year: selectedYear,
			});
			await utils.adminSettings.getOverview.invalidate();
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

	const yearOptions = buildYearOptions(configuredYears, selectedYear);

	return (
		<>
			<div className="fr-select-group fr-mb-3w">
				<label className="fr-label" htmlFor="campaign-year-selector">
					Année configurée
				</label>
				<select
					className="fr-select"
					id="campaign-year-selector"
					onChange={(e) => setSelectedYear(Number(e.target.value))}
					value={selectedYear}
				>
					{yearOptions.map((y) => (
						<option key={y} value={y}>
							{y}
						</option>
					))}
				</select>
			</div>

			<form noValidate onSubmit={onSubmit}>
				<input
					type="hidden"
					{...form.register("year", { valueAsNumber: true })}
				/>

				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend">Campagne</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
						{OPTIONAL_FIELDS.map((key) => (
							<div className="fr-col-12 fr-col-md-6" key={key}>
								<DateField
									error={form.formState.errors[key]?.message}
									fieldKey={key}
									register={form.register(key)}
									required={false}
								/>
							</div>
						))}
					</div>
				</fieldset>

				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend">Première déclaration</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
						{DECL1_FIELDS.map((key) => (
							<div className="fr-col-12 fr-col-md-4" key={key}>
								<DateField
									error={form.formState.errors[key]?.message}
									fieldKey={key}
									register={form.register(key)}
									required={true}
								/>
							</div>
						))}
					</div>
				</fieldset>

				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend">Deuxième déclaration</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
						{DECL2_FIELDS.map((key) => (
							<div className="fr-col-12 fr-col-md-4" key={key}>
								<DateField
									error={form.formState.errors[key]?.message}
									fieldKey={key}
									register={form.register(key)}
									required={true}
								/>
							</div>
						))}
					</div>
				</fieldset>

				{status === "success" && (
					<div
						aria-live="polite"
						className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
					>
						<p>Échéances enregistrées pour {selectedYear}.</p>
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
							disabled={mutation.isPending || deadlinesQuery.isLoading}
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
		ReturnType<typeof useZodForm<CampaignDeadlinesFormInput>>["register"]
	>;
	error: string | undefined;
	required: boolean;
};

function DateField({ fieldKey, register, error, required }: DateFieldProps) {
	const id = `settings-${fieldKey}`;
	return (
		<div
			className={
				error ? "fr-input-group fr-input-group--error" : "fr-input-group"
			}
		>
			<label className="fr-label" htmlFor={id}>
				{FIELD_LABELS[fieldKey]}
				{!required && <span className="fr-hint-text">Optionnel</span>}
			</label>
			<input
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={Boolean(error)}
				className="fr-input"
				id={id}
				required={required}
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

function buildDefaults(year: number): CampaignDeadlinesFormInput {
	return {
		year,
		gipPublicationDate: "",
		campaignStartDate: "",
		decl1ModificationDeadline: "",
		decl1JustificationDeadline: "",
		decl1JointEvaluationDeadline: "",
		decl2ModificationDeadline: "",
		decl2JustificationDeadline: "",
		decl2JointEvaluationDeadline: "",
	};
}

function buildYearOptions(
	configuredYears: readonly number[],
	selectedYear: number,
): number[] {
	const set = new Set<number>(configuredYears);
	set.add(selectedYear);
	for (let offset = -1; offset <= 2; offset++) {
		set.add(selectedYear + offset);
	}
	return Array.from(set).sort((a, b) => a - b);
}

"use client";

import { useEffect, useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { SettingsDateField, SettingsReadOnlyField } from "./SettingsFields";
import {
	type RemunerationDeadlinesFormInput,
	remunerationDeadlinesFormSchema,
} from "./schemas";
import type { CampaignDeadlinesByYear } from "./types";

type Props = {
	year: number;
};

type DeadlineKey = Exclude<keyof RemunerationDeadlinesFormInput, "year">;

type DeadlineGroup = {
	legend: string;
	hint?: string;
	pathChoiceKey?: "pathChoiceRound1Deadline" | "pathChoiceDeadline";
	fields: readonly DeadlineKey[];
};

const DEADLINE_GROUPS: readonly DeadlineGroup[] = [
	{
		legend: "Déclaration des indicateurs",
		fields: ["decl1ModificationDeadline"],
	},
	{
		legend: "Parcours de mise en conformité — 1er tour",
		pathChoiceKey: "pathChoiceRound1Deadline",
		fields: [
			"decl1JustificationDeadline",
			"decl1JointEvaluationDeadline",
			"decl2ModificationDeadline",
		],
	},
	{
		legend: "Parcours de mise en conformité — 2nd tour",
		pathChoiceKey: "pathChoiceDeadline",
		fields: ["decl2JustificationDeadline", "decl2JointEvaluationDeadline"],
	},
	{
		legend: "Avis du CSE",
		fields: ["decl2CseOpinionDeadline"],
	},
];

const FIELD_LABELS: Record<DeadlineKey, string> = {
	decl1ModificationDeadline: "Échéance de déclaration",
	decl1JustificationDeadline: "Échéance de justification des écarts",
	decl1JointEvaluationDeadline:
		"Échéance de dépôt du rapport d'évaluation conjointe",
	decl2ModificationDeadline:
		"Échéance de la seconde déclaration (actions correctives)",
	decl2JustificationDeadline: "Échéance de justification des écarts",
	decl2JointEvaluationDeadline:
		"Échéance de dépôt du rapport d'évaluation conjointe",
	decl2CseOpinionDeadline: "Échéance de dépôt de l'avis du CSE",
};

const FIELD_HINTS: Partial<Record<DeadlineKey, string>> = {
	decl2CseOpinionDeadline:
		"S'applique à toutes les entreprises soumises à l'avis du CSE, quel que soit le parcours.",
};

function selectDeadlines(data: CampaignDeadlinesByYear) {
	return {
		year: data.year,
		exists: data.exists,
		pathChoiceRound1Deadline: data.pathChoiceRound1Deadline,
		pathChoiceDeadline: data.pathChoiceDeadline,
		decl1ModificationDeadline: data.decl1ModificationDeadline,
		decl1JustificationDeadline: data.decl1JustificationDeadline,
		decl1JointEvaluationDeadline: data.decl1JointEvaluationDeadline,
		decl2ModificationDeadline: data.decl2ModificationDeadline,
		decl2JustificationDeadline: data.decl2JustificationDeadline,
		decl2JointEvaluationDeadline: data.decl2JointEvaluationDeadline,
		decl2CseOpinionDeadline: data.decl2CseOpinionDeadline,
	};
}

export function RemunerationDeadlinesForm({ year }: Props) {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const utils = api.useUtils();
	const deadlinesQuery = api.adminSettings.getDeadlinesByYear.useQuery(
		{ year },
		{ staleTime: 0, select: selectDeadlines },
	);

	const form = useZodForm(remunerationDeadlinesFormSchema, {
		defaultValues: buildDefaults(year),
	});

	const data = deadlinesQuery.data;

	useEffect(() => {
		if (!data) return;
		form.reset({
			year: data.year,
			decl1ModificationDeadline: data.decl1ModificationDeadline,
			decl1JustificationDeadline: data.decl1JustificationDeadline,
			decl1JointEvaluationDeadline: data.decl1JointEvaluationDeadline,
			decl2ModificationDeadline: data.decl2ModificationDeadline,
			decl2JustificationDeadline: data.decl2JustificationDeadline,
			decl2JointEvaluationDeadline: data.decl2JointEvaluationDeadline,
			decl2CseOpinionDeadline: data.decl2CseOpinionDeadline,
		});
	}, [data, form]);

	const mutation = api.adminSettings.upsertRemunerationDeadlines.useMutation({
		onSuccess: async (_result, variables) => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getDeadlinesByYear.invalidate({
				year: variables.year,
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

	const isDefault = data ? !data.exists : false;

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<input
				type="hidden"
				{...form.register("year", { valueAsNumber: true })}
			/>

			<div className="fr-p-3w fr-background-alt--grey">
				{isDefault && (
					<p className="fr-badge fr-badge--info fr-mb-2w">
						Valeurs par défaut — aucune surcharge enregistrée pour cette année
					</p>
				)}

				{DEADLINE_GROUPS.map((group) => (
					<fieldset className="fr-fieldset" key={group.legend}>
						<legend className="fr-fieldset__legend">{group.legend}</legend>
						<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
							{group.pathChoiceKey && (
								<div className="fr-col-12 fr-col-md-4">
									<SettingsReadOnlyField
										hint="Calculée — non paramétrable"
										id={`settings-${group.pathChoiceKey}`}
										label="Échéance de choix du parcours"
										type="date"
										value={data?.[group.pathChoiceKey] ?? ""}
									/>
								</div>
							)}
							{group.fields.map((key) => (
								<div className="fr-col-12 fr-col-md-4" key={key}>
									<SettingsDateField
										error={form.formState.errors[key]?.message}
										hint={FIELD_HINTS[key]}
										id={`settings-${key}`}
										label={FIELD_LABELS[key]}
										registration={form.register(key)}
										required
									/>
								</div>
							))}
						</div>
					</fieldset>
				))}
			</div>

			{status === "success" && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
				>
					<p>Échéances enregistrées pour {year}.</p>
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
	);
}

function buildDefaults(year: number): RemunerationDeadlinesFormInput {
	return {
		year,
		decl1ModificationDeadline: "",
		decl1JustificationDeadline: "",
		decl1JointEvaluationDeadline: "",
		decl2ModificationDeadline: "",
		decl2JustificationDeadline: "",
		decl2JointEvaluationDeadline: "",
		decl2CseOpinionDeadline: "",
	};
}

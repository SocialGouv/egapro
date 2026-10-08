"use client";

import { useEffect, useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { DeadlineFieldset } from "./DeadlineFieldset";
import { DEADLINE_GROUPS } from "./remunerationDeadlineGroups";
import {
	SettingsFormFooter,
	type SettingsFormStatus,
	SettingsLoadError,
} from "./SettingsFields";
import {
	type RemunerationDeadlinesFormInput,
	remunerationDeadlinesFormSchema,
} from "./schemas";
import type { CampaignDeadlinesByYear } from "./types";

type Props = {
	year: number;
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
	const [status, setStatus] = useState<SettingsFormStatus>("idle");
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
		if (!data) return;
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

			{deadlinesQuery.isError && !data && (
				<SettingsLoadError onRetry={() => void deadlinesQuery.refetch()} />
			)}

			<div className="fr-p-3w fr-background-alt--grey">
				{isDefault && (
					<p className="fr-badge fr-badge--info fr-mb-2w">
						Valeurs par défaut — aucune surcharge enregistrée pour cette année
					</p>
				)}

				{DEADLINE_GROUPS.map((group) => (
					<DeadlineFieldset
						errors={form.formState.errors}
						group={group}
						key={group.legend}
						pathChoiceValue={
							group.pathChoiceKey ? (data?.[group.pathChoiceKey] ?? "") : ""
						}
						register={form.register}
					/>
				))}
			</div>

			<SettingsFormFooter
				isPending={mutation.isPending}
				serverError={serverError}
				status={status}
				submitDisabled={!data}
				successMessage={`Échéances enregistrées pour ${year}.`}
			/>
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

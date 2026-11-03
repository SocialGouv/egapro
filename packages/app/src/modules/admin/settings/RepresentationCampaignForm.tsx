"use client";

import { useEffect, useId, useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import {
	SettingsDateField,
	SettingsFormFooter,
	type SettingsFormStatus,
	SettingsLoadError,
} from "./SettingsFields";
import {
	type RepresentationCampaignFormInput,
	representationCampaignFormSchema,
} from "./schemas";

type Props = {
	year: number;
};

export function RepresentationCampaignForm({ year }: Props) {
	const [status, setStatus] = useState<SettingsFormStatus>("idle");
	const [serverError, setServerError] = useState<string | null>(null);
	const requiredNoteId = useId();

	const utils = api.useUtils();
	const campaignQuery =
		api.adminSettings.getRepresentationCampaignByYear.useQuery(
			{ year },
			{ staleTime: 0 },
		);

	const form = useZodForm(representationCampaignFormSchema, {
		defaultValues: buildDefaults(year),
	});

	useEffect(() => {
		if (!campaignQuery.data) return;
		form.reset({
			year: campaignQuery.data.year,
			declarationDeadline: campaignQuery.data.declarationDeadline,
		});
	}, [campaignQuery.data, form]);

	const mutation = api.adminSettings.upsertRepresentationCampaign.useMutation({
		onSuccess: async (_result, variables) => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getRepresentationCampaignByYear.invalidate({
				year: variables.year,
			});
		},
		onError: (err) => {
			setStatus("error");
			setServerError(err.message);
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		if (!campaignQuery.data) return;
		setStatus("idle");
		mutation.mutate(values);
	});

	const isDefault = campaignQuery.data?.isDefault ?? false;

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<input
				type="hidden"
				{...form.register("year", { valueAsNumber: true })}
			/>

			{campaignQuery.isError && !campaignQuery.data && (
				<SettingsLoadError onRetry={() => void campaignQuery.refetch()} />
			)}

			<div className="fr-p-3w fr-background-alt--grey">
				{isDefault && (
					<p className="fr-badge fr-badge--info fr-mb-2w">
						Valeurs par défaut — aucune surcharge enregistrée pour cette année
					</p>
				)}

				<p className="fr-text--sm fr-mb-2w" id={requiredNoteId}>
					Tous les champs sont obligatoires.
				</p>

				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend">
						Déclaration des indicateurs
					</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
						<div className="fr-col-12 fr-col-md-4">
							<SettingsDateField
								error={form.formState.errors.declarationDeadline?.message}
								id="representation-settings-declarationDeadline"
								label="Échéance de la déclaration"
								registration={form.register("declarationDeadline")}
								required
								requiredNoteId={requiredNoteId}
							/>
						</div>
					</div>
				</fieldset>
			</div>

			<SettingsFormFooter
				isPending={mutation.isPending}
				serverError={serverError}
				status={status}
				submitDisabled={!campaignQuery.data}
				successMessage={`Campagne représentation équilibrée enregistrée pour ${year}.`}
			/>
		</form>
	);
}

function buildDefaults(year: number): RepresentationCampaignFormInput {
	return {
		year,
		declarationDeadline: "",
	};
}

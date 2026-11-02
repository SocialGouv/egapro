"use client";

import { useEffect, useState } from "react";

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

type DateFieldKey = Exclude<keyof RepresentationCampaignFormInput, "year">;

const DATE_FIELDS: readonly DateFieldKey[] = [
	"campaignStartDate",
	"campaignEndDate",
	"declarationDeadline",
];

const FIELD_LABELS: Record<DateFieldKey, string> = {
	campaignStartDate: "Date de démarrage de la campagne",
	campaignEndDate: "Date de clôture de la campagne",
	declarationDeadline: "Échéance de déclaration",
};

export function RepresentationCampaignForm({ year }: Props) {
	const [status, setStatus] = useState<SettingsFormStatus>("idle");
	const [serverError, setServerError] = useState<string | null>(null);

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
			campaignStartDate: campaignQuery.data.campaignStartDate,
			campaignEndDate: campaignQuery.data.campaignEndDate,
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

				<fieldset className="fr-fieldset">
					<legend className="fr-fieldset__legend">
						Campagne représentation équilibrée
					</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
						{DATE_FIELDS.map((key) => (
							<div className="fr-col-12 fr-col-md-4" key={key}>
								<SettingsDateField
									error={form.formState.errors[key]?.message}
									id={`representation-settings-${key}`}
									label={FIELD_LABELS[key]}
									registration={form.register(key)}
									required
								/>
							</div>
						))}
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
		campaignStartDate: "",
		campaignEndDate: "",
		declarationDeadline: "",
	};
}

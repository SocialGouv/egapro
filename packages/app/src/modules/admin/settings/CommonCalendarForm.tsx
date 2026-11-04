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
	commonCalendarFormSchema,
	getCommonCalendarPreconditionMessage,
} from "./schemas";
import type { CampaignDeadlinesByYear } from "./types";

type Props = {
	year: number;
};

function selectCommonCalendar(data: CampaignDeadlinesByYear) {
	return {
		year: data.year,
		exists: data.exists,
		campaignStartDate: data.campaignStartDate,
		publicDataReleaseDate: data.publicDataReleaseDate,
	};
}

export function CommonCalendarForm({ year }: Props) {
	const [status, setStatus] = useState<SettingsFormStatus>("idle");
	const [serverError, setServerError] = useState<string | null>(null);
	const requiredNoteId = useId();

	const utils = api.useUtils();
	const calendarQuery = api.adminSettings.getDeadlinesByYear.useQuery(
		{ year },
		{ staleTime: 0, select: selectCommonCalendar },
	);

	const form = useZodForm(commonCalendarFormSchema, {
		defaultValues: { year, campaignStartDate: "", publicDataReleaseDate: "" },
	});

	const data = calendarQuery.data;

	useEffect(() => {
		if (!data) return;
		form.reset({
			year: data.year,
			campaignStartDate: data.campaignStartDate ?? "",
			publicDataReleaseDate: data.publicDataReleaseDate ?? "",
		});
	}, [data, form]);

	const mutation = api.adminSettings.updateCommonCalendar.useMutation({
		onSuccess: async (_result, variables) => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getDeadlinesByYear.invalidate({
				year: variables.year,
			});
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

	const isLocked = data ? !data.exists : false;
	const hasLoadError = calendarQuery.isError && !data;
	const lockedMessageId = "common-calendar-locked";

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<input
				type="hidden"
				{...form.register("year", { valueAsNumber: true })}
			/>

			{hasLoadError && (
				<SettingsLoadError onRetry={() => void calendarQuery.refetch()} />
			)}

			{isLocked && (
				<div
					className="fr-alert fr-alert--info fr-alert--sm fr-mb-2w"
					id={lockedMessageId}
				>
					<p>{getCommonCalendarPreconditionMessage(year)}</p>
				</div>
			)}

			<div className="fr-p-3w fr-background-alt--grey">
				<p className="fr-text--sm fr-mb-2w" id={requiredNoteId}>
					La date d'ouverture de la campagne est obligatoire.
				</p>

				<fieldset
					aria-describedby={isLocked ? lockedMessageId : undefined}
					className="fr-fieldset"
					disabled={isLocked}
				>
					<legend className="fr-fieldset__legend">
						Dates communes aux démarches
					</legend>
					<div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
						<div className="fr-col-12 fr-col-md-4">
							<SettingsDateField
								error={form.formState.errors.campaignStartDate?.message}
								hint="Date à partir de laquelle les entreprises peuvent effectuer leur démarche."
								id="settings-campaignStartDate"
								label="Date d'ouverture de la campagne"
								registration={form.register("campaignStartDate")}
								required
								requiredNoteId={requiredNoteId}
							/>
						</div>
						<div className="fr-col-12 fr-col-md-4">
							<SettingsDateField
								error={form.formState.errors.publicDataReleaseDate?.message}
								hint="Date à partir de laquelle les indicateurs de rémunération et les indicateurs de représentation de cette campagne sont publiés. Vide : non publiés."
								id="settings-publicDataReleaseDate"
								label="Date de publication des résultats"
								registration={form.register("publicDataReleaseDate")}
								required={false}
							/>
						</div>
					</div>
				</fieldset>
			</div>

			<SettingsFormFooter
				isPending={mutation.isPending}
				serverError={serverError}
				status={status}
				submitDisabled={!data || isLocked}
				successMessage={`Calendrier de la campagne enregistré pour ${year}.`}
			/>
		</form>
	);
}

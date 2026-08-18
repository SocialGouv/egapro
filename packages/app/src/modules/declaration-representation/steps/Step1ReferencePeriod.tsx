"use client";

import { useEffect, useState } from "react";
import { formatShortDate } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import {
	computePeriodEnd,
	computePeriodStart,
	referencePeriodSchema,
} from "../schemas";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";

const REQUIRED_DATES_MESSAGE =
	"Sélectionner une date de début ou une date de fin.";

export function Step1ReferencePeriod() {
	const { year, draft, setDraftValues, isReadOnly, registerStepValidator } =
		useRepresentationDraftContext();

	const form = useZodForm(referencePeriodSchema(year), {
		defaultValues: {
			referencePeriodStart: draft.referencePeriodStart ?? "",
			referencePeriodEnd: draft.referencePeriodEnd ?? "",
		},
	});

	const referencePeriodStart = form.watch("referencePeriodStart") ?? "";
	const referencePeriodEnd = form.watch("referencePeriodEnd") ?? "";
	const { errors } = form.formState;
	const [announcement, setAnnouncement] = useState("");

	useEffect(() => {
		registerStepValidator(async () => {
			const start = form.getValues("referencePeriodStart");
			const end = form.getValues("referencePeriodEnd");

			if (!start || !end) {
				form.setError(start ? "referencePeriodEnd" : "referencePeriodStart", {
					message: REQUIRED_DATES_MESSAGE,
					type: "manual",
				});
				return false;
			}

			return form.trigger();
		});
		return () => registerStepValidator(null);
	}, [form, registerStepValidator]);

	// The period always spans 12 consecutive months: filling one date derives
	// the other. The auto-fill is announced to screen readers like the linked
	// women/men percentage fields (accessibility pre-audit requirement).
	function handleStartChange(event: React.ChangeEvent<HTMLInputElement>) {
		const value = event.target.value;
		const end =
			value === "" ? "" : (computePeriodEnd(value) ?? referencePeriodEnd);
		form.setValue("referencePeriodStart", value);
		form.setValue("referencePeriodEnd", end);
		setDraftValues({
			referencePeriodEnd: end,
			referencePeriodStart: value,
		});
		setAnnouncement(
			value === "" || computePeriodEnd(value) === undefined
				? ""
				: `Date de fin : ${formatShortDate(new Date(end))} renseignée automatiquement.`,
		);
	}

	function handleEndChange(event: React.ChangeEvent<HTMLInputElement>) {
		const value = event.target.value;
		const start =
			value === "" ? "" : (computePeriodStart(value) ?? referencePeriodStart);
		form.setValue("referencePeriodEnd", value);
		form.setValue("referencePeriodStart", start);
		setDraftValues({
			referencePeriodEnd: value,
			referencePeriodStart: start,
		});
		setAnnouncement(
			value === "" || computePeriodStart(value) === undefined
				? ""
				: `Date de début : ${formatShortDate(new Date(start))} renseignée automatiquement.`,
		);
	}

	return (
		<>
			<p className="fr-text-title--grey">
				Année de référence : <strong>{year}</strong>
			</p>
			<p className="fr-text-title--grey">
				Sélectionnez la période de l'exercice comptable utilisé pour le calcul
				des écarts.
			</p>
			<p className="fr-text-title--grey">Tous les champs sont obligatoires.</p>

			<fieldset className="fr-fieldset">
				<legend className="fr-sr-only">Dates de la période de référence</legend>
				<div className="fr-fieldset__content">
					<div className="fr-grid-row fr-grid-row--gutters">
						<div className="fr-col-12 fr-col-md-6">
							<div
								className={
									errors.referencePeriodStart
										? "fr-input-group fr-input-group--error"
										: "fr-input-group"
								}
							>
								<label className="fr-label" htmlFor="reference-period-start">
									Date de début
									<span className="fr-hint-text">
										Format attendu : JJ/MM/AAAA
									</span>
								</label>
								<input
									aria-describedby="reference-period-start-messages"
									aria-invalid={errors.referencePeriodStart ? true : undefined}
									className={
										errors.referencePeriodStart
											? "fr-input fr-input--error"
											: "fr-input"
									}
									id="reference-period-start"
									onChange={handleStartChange}
									readOnly={isReadOnly}
									type="date"
									value={referencePeriodStart}
								/>
								<div
									aria-atomic="true"
									aria-live="polite"
									className="fr-messages-group"
									id="reference-period-start-messages"
								>
									{errors.referencePeriodStart ? (
										<p className="fr-message fr-message--error">
											{errors.referencePeriodStart.message}
										</p>
									) : null}
								</div>
							</div>
						</div>
						<div className="fr-col-12 fr-col-md-6">
							<div
								className={
									errors.referencePeriodEnd
										? "fr-input-group fr-input-group--error"
										: "fr-input-group"
								}
							>
								<label className="fr-label" htmlFor="reference-period-end">
									Date de fin
									<span className="fr-hint-text">
										Format attendu : JJ/MM/AAAA
									</span>
								</label>
								<input
									aria-describedby="reference-period-end-messages"
									aria-invalid={errors.referencePeriodEnd ? true : undefined}
									className={
										errors.referencePeriodEnd
											? "fr-input fr-input--error"
											: "fr-input"
									}
									id="reference-period-end"
									onChange={handleEndChange}
									readOnly={isReadOnly}
									type="date"
									value={referencePeriodEnd}
								/>
								<div
									aria-atomic="true"
									aria-live="polite"
									className="fr-messages-group"
									id="reference-period-end-messages"
								>
									{errors.referencePeriodEnd ? (
										<p className="fr-message fr-message--error">
											{errors.referencePeriodEnd.message}
										</p>
									) : null}
								</div>
							</div>
						</div>
					</div>
				</div>
			</fieldset>

			<div className="fr-messages-group">
				<p className="fr-message fr-message--info">
					La période couvre 12 mois consécutifs : la date de fin est calculée
					automatiquement à partir de la date de début, et inversement.
				</p>
			</div>
			<p aria-atomic="true" aria-live="polite" className="fr-sr-only">
				{announcement}
			</p>
		</>
	);
}

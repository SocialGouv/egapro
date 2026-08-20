"use client";

import { useCallback, useEffect, useId } from "react";
import { Controller } from "react-hook-form";

import { TrackedLink } from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { useZodForm } from "~/modules/shared/useZodForm";
import { nextCalendarDay, publicationSchema } from "../schemas";
import { useRepresentationDraftContext } from "../shared/draft/DraftContext";
import styles from "./Step4Publication.module.scss";

type PublicationFieldErrors = Partial<
	Record<
		"publishDate" | "hasWebsite" | "publishUrl" | "publishModalities",
		{ message?: string }
	>
>;

export function Step4Publication() {
	const { draft, setDraftValues, isReadOnly, registerStepValidator } =
		useRepresentationDraftContext();
	const referencePeriodEnd = draft.referencePeriodEnd;

	const baseId = useId();
	const dateId = `${baseId}-date`;
	const dateMessagesId = `${dateId}-messages`;
	const websiteLegendId = `${baseId}-website-legend`;
	const websiteMessagesId = `${baseId}-website-messages`;
	const websiteYesId = `${baseId}-website-yes`;
	const websiteNoId = `${baseId}-website-no`;
	const urlId = `${baseId}-url`;
	const urlMessagesId = `${urlId}-messages`;
	const modalitiesId = `${baseId}-modalities`;
	const modalitiesMessagesId = `${modalitiesId}-messages`;
	const accordionId = `${baseId}-transparency-obligation`;

	const form = useZodForm(publicationSchema, {
		defaultValues: {
			publishDate: draft.publishDate,
			hasWebsite: draft.hasWebsite,
			publishUrl: draft.publishUrl,
			publishModalities: draft.publishModalities,
		},
	});

	const hasWebsite = form.watch("hasWebsite");

	useEffect(() => {
		const subscription = form.watch((values) => {
			setDraftValues(values);
		});
		return () => subscription.unsubscribe();
	}, [form, setDraftValues]);

	const guard = useCallback(async () => {
		const values = form.getValues();

		if (!values.publishDate) {
			form.setError("publishDate", {
				type: "manual",
				message: "Indiquez la date de publication des écarts calculables.",
			});
			return false;
		}

		if (
			referencePeriodEnd !== undefined &&
			values.publishDate <= referencePeriodEnd
		) {
			form.setError("publishDate", {
				type: "manual",
				message:
					"La date de publication doit être postérieure à la fin de la période de référence.",
			});
			return false;
		}

		if (values.hasWebsite === undefined) {
			form.setError("hasWebsite", {
				type: "manual",
				message:
					"Précisez si l'entreprise a un site Internet pour publier les écarts calculables.",
			});
			return false;
		}

		return form.trigger();
	}, [form, referencePeriodEnd]);

	useEffect(() => {
		registerStepValidator(guard);
		return () => registerStepValidator(null);
	}, [registerStepValidator, guard]);

	const errors = form.formState.errors as PublicationFieldErrors;
	const dateError = errors.publishDate?.message;
	const websiteError = errors.hasWebsite?.message;
	const urlError = errors.publishUrl?.message;
	const modalitiesError = errors.publishModalities?.message;
	const publishDateMin =
		referencePeriodEnd !== undefined
			? nextCalendarDay(referencePeriodEnd)
			: undefined;

	return (
		<div>
			<p className={`fr-mb-2w ${styles.intro}`}>
				Vous devez publier vos écarts chaque année, au plus tard le 1er mars.
			</p>
			<p className={`fr-mb-2w ${styles.mandatory}`}>
				Tous les champs sont obligatoires.
			</p>

			<div
				className={`fr-input-group fr-mb-4w ${styles.dateField} ${dateError ? "fr-input-group--error" : ""}`}
			>
				<label className="fr-label" htmlFor={dateId}>
					Date de publication des écarts calculables
					<span className="fr-hint-text">Format attendu : JJ/MM/AAAA</span>
				</label>
				<input
					aria-describedby={dateMessagesId}
					aria-invalid={dateError ? true : undefined}
					className="fr-input"
					id={dateId}
					min={publishDateMin}
					readOnly={isReadOnly}
					required
					type="date"
					{...form.register("publishDate")}
				/>
				<div
					aria-atomic="true"
					aria-live="polite"
					className="fr-messages-group"
					id={dateMessagesId}
				>
					{dateError ? (
						<p className="fr-message fr-message--error">{dateError}</p>
					) : null}
				</div>
			</div>

			<fieldset
				aria-labelledby={`${websiteLegendId} ${websiteMessagesId}`}
				className={`fr-fieldset ${styles.websiteFieldset} ${websiteError ? "fr-fieldset--error" : ""}`}
			>
				<legend
					className="fr-fieldset__legend--regular fr-fieldset__legend"
					id={websiteLegendId}
				>
					Avez-vous un site Internet pour publier les écarts calculables ?
				</legend>
				<Controller
					control={form.control}
					name="hasWebsite"
					render={({ field }) => (
						<>
							<div className="fr-fieldset__element fr-fieldset__element--inline">
								<div className="fr-radio-group">
									<input
										checked={field.value === true}
										disabled={isReadOnly}
										id={websiteYesId}
										name={field.name}
										onChange={() => field.onChange(true)}
										required
										type="radio"
										value="true"
									/>
									<label className="fr-label" htmlFor={websiteYesId}>
										Oui
									</label>
								</div>
							</div>
							<div className="fr-fieldset__element fr-fieldset__element--inline">
								<div className="fr-radio-group">
									<input
										checked={field.value === false}
										disabled={isReadOnly}
										id={websiteNoId}
										name={field.name}
										onChange={() => field.onChange(false)}
										required
										type="radio"
										value="false"
									/>
									<label className="fr-label" htmlFor={websiteNoId}>
										Non
									</label>
								</div>
							</div>
						</>
					)}
				/>
				<div
					aria-atomic="true"
					aria-live="polite"
					className="fr-messages-group"
					id={websiteMessagesId}
				>
					{websiteError ? (
						<p className="fr-message fr-message--error">{websiteError}</p>
					) : null}
				</div>
			</fieldset>

			{hasWebsite === true ? (
				<div
					className={`fr-input-group ${urlError ? "fr-input-group--error" : ""}`}
				>
					<label className="fr-label" htmlFor={urlId}>
						Indiquez l'adresse de la page Internet (URL) sur laquelle seront
						publiés les écarts calculables.
					</label>
					<input
						aria-describedby={urlMessagesId}
						aria-invalid={urlError ? true : undefined}
						aria-required="true"
						className="fr-input"
						id={urlId}
						readOnly={isReadOnly}
						type="text"
						{...form.register("publishUrl")}
					/>
					<div
						aria-atomic="true"
						aria-live="polite"
						className="fr-messages-group"
						id={urlMessagesId}
					>
						{urlError ? (
							<p className="fr-message fr-message--error">{urlError}</p>
						) : null}
					</div>
				</div>
			) : null}

			{hasWebsite === false ? (
				<div
					className={`fr-input-group ${modalitiesError ? "fr-input-group--error" : ""}`}
				>
					<label className="fr-label" htmlFor={modalitiesId}>
						Indiquer les modalités de communication des écarts calculables
						auprès de vos salariés.
					</label>
					<textarea
						aria-describedby={modalitiesMessagesId}
						aria-invalid={modalitiesError ? true : undefined}
						aria-required="true"
						className="fr-input"
						id={modalitiesId}
						readOnly={isReadOnly}
						{...form.register("publishModalities")}
					/>
					<div
						aria-atomic="true"
						aria-live="polite"
						className="fr-messages-group"
						id={modalitiesMessagesId}
					>
						{modalitiesError ? (
							<p className="fr-message fr-message--error">{modalitiesError}</p>
						) : null}
					</div>
				</div>
			) : null}

			<section className="fr-accordion fr-mt-4w">
				<h3 className="fr-accordion__title">
					<button
						aria-controls={accordionId}
						aria-expanded="false"
						className="fr-accordion__btn"
						type="button"
					>
						Obligation de transparence
					</button>
				</h3>
				<div className="fr-collapse" id={accordionId}>
					<p>
						Les entreprises doivent publier chaque année, au plus tard le 1er
						mars, leurs écarts éventuels de représentation femmes-hommes pour
						les cadres dirigeants et au sein des instances dirigeantes de
						manière visible et lisible sur leur site internet, et les laisser en
						ligne jusqu'à la publication de leurs écarts l'année suivante. Si
						l'entreprise ne dispose pas de site internet, elle doit porter ces
						informations à la connaissance des salariés par tout moyen.
					</p>
					<TrackedLink
						className="fr-link"
						href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
						rel="noopener noreferrer"
						target="_blank"
						trackingId="representation_publication_transparency_obligation"
					>
						En savoir plus
						<NewTabNotice />
					</TrackedLink>
				</div>
			</section>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { Controller } from "react-hook-form";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { subjectionSchema } from "./schemas";
import { stepHref } from "./steps";

type SubjectionScreenProps = {
	campaignYear: number;
	initialAnswer?: "concerned" | "not_concerned";
	year: number;
};

export function SubjectionScreen({
	campaignYear,
	initialAnswer,
	year,
}: SubjectionScreenProps) {
	const router = useRouter();
	const legendId = useId();
	const messagesId = useId();

	const form = useZodForm(subjectionSchema, {
		defaultValues: { answer: initialAnswer ?? null },
	});

	const answer = form.watch("answer");

	const declareNotSubjectMutation =
		api.representationDeclaration.declareNotSubject.useMutation({
			onSuccess: () => {
				router.push("/mon-espace");
			},
		});

	const onSubmit = form.handleSubmit((data) => {
		if (data.answer === "concerned") {
			router.push(stepHref(1));
			return;
		}
		declareNotSubjectMutation.mutate({ year });
	});

	return (
		<>
			<h1 className="fr-h4">
				Démarche des indicateurs de représentation {campaignYear}
			</h1>
			<h2 className="fr-h6">L'entreprise est-elle concernée ?</h2>

			<p className="fr-text-title--grey fr-mt-4w fr-mb-2w">
				Indiquez si votre entreprise emploie au moins 1 000 salariés durant les
				trois derniers exercices consécutifs.
			</p>
			<p className="fr-text-title--grey fr-mb-2w">
				Ce seuil détermine si votre entreprise est tenue de déclarer ses écarts
				de représentation femmes-hommes parmi les cadres dirigeants et les
				membres des instances dirigeantes.
			</p>
			<p className="fr-text-title--grey fr-mb-4w">
				Tous les champs sont obligatoires.
			</p>

			<form onSubmit={onSubmit}>
				<Controller
					control={form.control}
					name="answer"
					render={({ field, fieldState }) => (
						<fieldset
							aria-labelledby={`${legendId} ${messagesId}`}
							className={
								fieldState.error
									? "fr-fieldset fr-fieldset--error"
									: "fr-fieldset"
							}
						>
							<legend className="fr-sr-only" id={legendId}>
								Nombre de salariés de l'entreprise
							</legend>
							<div className="fr-fieldset__element">
								<div className="fr-radio-group fr-radio-rich">
									<input
										checked={field.value === "concerned"}
										id="subjection-concerned"
										name={field.name}
										onChange={() => field.onChange("concerned")}
										type="radio"
									/>
									<label
										className={
											fieldState.error ? "fr-label fr-label--error" : "fr-label"
										}
										htmlFor="subjection-concerned"
									>
										1 000 salariés ou plus sur les trois exercices
										<span className="fr-hint-text">
											Votre entreprise est tenue de déclarer ses écarts de
											représentation.
										</span>
									</label>
								</div>
							</div>
							<div className="fr-fieldset__element">
								<div className="fr-radio-group fr-radio-rich">
									<input
										checked={field.value === "not_concerned"}
										id="subjection-not-concerned"
										name={field.name}
										onChange={() => field.onChange("not_concerned")}
										type="radio"
									/>
									<label
										className={
											fieldState.error ? "fr-label fr-label--error" : "fr-label"
										}
										htmlFor="subjection-not-concerned"
									>
										Moins de 1 000 salariés sur au moins un exercice
										<span className="fr-hint-text">
											Votre entreprise n'est pas concernée par cette
											déclaration.
										</span>
									</label>
								</div>
							</div>
							<div
								aria-atomic="true"
								aria-live="polite"
								className="fr-messages-group"
								id={messagesId}
							>
								{fieldState.error ? (
									<p className="fr-message fr-message--error">
										{fieldState.error.message}
									</p>
								) : null}
							</div>
						</fieldset>
					)}
				/>

				{answer === "not_concerned" ? (
					<div className="fr-background-alt--blue-france fr-p-4w">
						<p className="fr-mb-0">
							Vous n'êtes pas assujetti à la publication et à la déclaration des
							écarts éventuels de représentation entre les femmes et les hommes.
							<br />
							Vous pouvez valider pour achever votre déclaration de
							représentation {campaignYear}.
						</p>
					</div>
				) : null}

				{declareNotSubjectMutation.error ? (
					<div className="fr-alert fr-alert--error fr-alert--sm" role="alert">
						<p>{declareNotSubjectMutation.error.message}</p>
					</div>
				) : null}

				{/* fr-btns-group--icon-right: without it, DSFR 1.14 treats any
				    icon-carrying .fr-btn in a group as icon-only and clamps it to
				    2.5rem, truncating the "Suivant" label. */}
				<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-right fr-btns-group--right fr-mt-4w">
					{answer === "not_concerned" ? (
						<li>
							<button
								className="fr-btn"
								disabled={declareNotSubjectMutation.isPending}
								type="submit"
							>
								Valider
							</button>
						</li>
					) : (
						<li>
							<button
								className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
								type="submit"
							>
								Suivant
							</button>
						</li>
					)}
				</ul>
			</form>
		</>
	);
}

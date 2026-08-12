"use client";

import { useId, useState } from "react";

const PERCENTAGE_INPUT_PATTERN = /^\d{0,3}([.,]\d?)?$/;

export type PercentagePairValues = {
	womenPercent: string;
	menPercent: string;
};

type PercentagePairFieldsProps = {
	legend: string;
	values: PercentagePairValues;
	onChange: (values: PercentagePairValues) => void;
	hint?: string;
	womenLabel?: string;
	menLabel?: string;
	error?: string;
	disabled?: boolean;
};

export function complementPercentage(raw: string): string | undefined {
	const normalized = raw.replace(",", ".");
	if (normalized === "" || normalized.endsWith(".")) return undefined;
	const value = Number(normalized);
	if (!Number.isFinite(value) || value < 0 || value > 100) return undefined;
	return String(Math.round((100 - value) * 10) / 10);
}

export function isPercentageInput(raw: string): boolean {
	if (!PERCENTAGE_INPUT_PATTERN.test(raw)) return false;
	if (raw === "") return true;
	const value = Number(raw.replace(",", "."));
	return Number.isFinite(value) && value <= 100;
}

export function PercentagePairFields({
	legend,
	values,
	onChange,
	hint = "La saisie d'un pourcentage calcule automatiquement l'autre.",
	womenLabel = "Femmes",
	menLabel = "Hommes",
	error,
	disabled = false,
}: PercentagePairFieldsProps) {
	const baseId = useId();
	const womenId = `${baseId}-women`;
	const menId = `${baseId}-men`;
	const hintId = `${baseId}-hint`;
	const errorId = `${baseId}-error`;
	const [editedFields, setEditedFields] = useState({
		women: false,
		men: false,
	});

	function handleWomenChange(raw: string) {
		if (!isPercentageInput(raw)) return;
		setEditedFields((previous) => ({ ...previous, women: true }));
		const complement = editedFields.men ? undefined : complementPercentage(raw);
		onChange({
			womenPercent: raw,
			menPercent: complement ?? values.menPercent,
		});
	}

	function handleMenChange(raw: string) {
		if (!isPercentageInput(raw)) return;
		setEditedFields((previous) => ({ ...previous, men: true }));
		const complement = editedFields.women
			? undefined
			: complementPercentage(raw);
		onChange({
			womenPercent: complement ?? values.womenPercent,
			menPercent: raw,
		});
	}

	const describedBy = [hint ? hintId : null, error ? errorId : null]
		.filter(Boolean)
		.join(" ");

	return (
		<fieldset
			className={`fr-fieldset ${error ? "fr-fieldset--error" : ""}`}
			disabled={disabled}
		>
			<legend className="fr-fieldset__legend fr-text--regular">
				{legend}
				{hint ? (
					<span className="fr-hint-text" id={hintId}>
						{hint}
					</span>
				) : null}
			</legend>
			<div className="fr-fieldset__content">
				<div className="fr-grid-row fr-grid-row--gutters">
					<div className="fr-col-12 fr-col-sm-4">
						<div className="fr-input-group">
							<label className="fr-label" htmlFor={womenId}>
								{womenLabel}
								<span className="fr-hint-text">En pourcentage</span>
							</label>
							<input
								aria-describedby={describedBy || undefined}
								aria-invalid={error ? true : undefined}
								className="fr-input"
								id={womenId}
								inputMode="decimal"
								onChange={(event) => handleWomenChange(event.target.value)}
								type="text"
								value={values.womenPercent}
							/>
						</div>
					</div>
					<div className="fr-col-12 fr-col-sm-4">
						<div className="fr-input-group">
							<label className="fr-label" htmlFor={menId}>
								{menLabel}
								<span className="fr-hint-text">En pourcentage</span>
							</label>
							<input
								aria-describedby={describedBy || undefined}
								aria-invalid={error ? true : undefined}
								className="fr-input"
								id={menId}
								inputMode="decimal"
								onChange={(event) => handleMenChange(event.target.value)}
								type="text"
								value={values.menPercent}
							/>
						</div>
					</div>
				</div>
			</div>
			{error ? (
				<div aria-live="polite" className="fr-messages-group" id={errorId}>
					<p className="fr-message fr-message--error">{error}</p>
				</div>
			) : null}
		</fieldset>
	);
}

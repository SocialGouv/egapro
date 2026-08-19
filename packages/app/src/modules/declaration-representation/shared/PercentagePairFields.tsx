"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

import styles from "./PercentagePairFields.module.scss";

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
	readOnly?: boolean;
	trailingContent?: ReactNode;
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
	readOnly = false,
	trailingContent,
}: PercentagePairFieldsProps) {
	const baseId = useId();
	const womenId = `${baseId}-women`;
	const menId = `${baseId}-men`;
	const hintId = `${baseId}-hint`;
	const errorId = `${baseId}-error`;
	const [announcement, setAnnouncement] = useState("");

	function handleWomenChange(raw: string) {
		if (!isPercentageInput(raw)) return;
		const complement = complementPercentage(raw);
		setAnnouncement(
			complement === undefined
				? ""
				: `${menLabel} : ${complement} % renseigné automatiquement.`,
		);
		onChange({
			womenPercent: raw,
			menPercent: complement ?? values.menPercent,
		});
	}

	function handleMenChange(raw: string) {
		if (!isPercentageInput(raw)) return;
		const complement = complementPercentage(raw);
		setAnnouncement(
			complement === undefined
				? ""
				: `${womenLabel} : ${complement} % renseigné automatiquement.`,
		);
		onChange({
			womenPercent: complement ?? values.womenPercent,
			menPercent: raw,
		});
	}

	const describedBy = [hint ? hintId : null, error ? errorId : null]
		.filter(Boolean)
		.join(" ");

	return (
		<fieldset className={`fr-fieldset ${error ? "fr-fieldset--error" : ""}`}>
			<legend className={`fr-fieldset__legend ${styles.legend}`}>
				{legend}
			</legend>
			<div className="fr-fieldset__content">
				<div className={styles.fieldsRow}>
					<div className={styles.field}>
						<div className="fr-input-group">
							<label className="fr-label" htmlFor={womenId}>
								{womenLabel}
								<span className="fr-sr-only">(en pourcentage)</span>
							</label>
							<div className={styles.inputWithUnit}>
								<input
									aria-describedby={describedBy || undefined}
									aria-invalid={error ? true : undefined}
									aria-required="true"
									className="fr-input"
									id={womenId}
									inputMode="decimal"
									onChange={(event) => handleWomenChange(event.target.value)}
									readOnly={readOnly}
									type="text"
									value={values.womenPercent}
								/>
								<span aria-hidden="true" className={styles.unit}>
									%
								</span>
							</div>
						</div>
					</div>
					<div className={styles.field}>
						<div className="fr-input-group">
							<label className="fr-label" htmlFor={menId}>
								{menLabel}
								<span className="fr-sr-only">(en pourcentage)</span>
							</label>
							<div className={styles.inputWithUnit}>
								<input
									aria-describedby={describedBy || undefined}
									aria-invalid={error ? true : undefined}
									aria-required="true"
									className="fr-input"
									id={menId}
									inputMode="decimal"
									onChange={(event) => handleMenChange(event.target.value)}
									readOnly={readOnly}
									type="text"
									value={values.menPercent}
								/>
								<span aria-hidden="true" className={styles.unit}>
									%
								</span>
							</div>
						</div>
					</div>
					{trailingContent ? <div>{trailingContent}</div> : null}
				</div>
			</div>
			{hint ? (
				<p className={`fr-message fr-message--info ${styles.hint}`} id={hintId}>
					{hint}
				</p>
			) : null}
			<div
				aria-atomic="true"
				aria-live="polite"
				className="fr-messages-group"
				id={errorId}
			>
				{error ? <p className="fr-message fr-message--error">{error}</p> : null}
			</div>
			<p aria-atomic="true" aria-live="polite" className="fr-sr-only">
				{announcement}
			</p>
		</fieldset>
	);
}

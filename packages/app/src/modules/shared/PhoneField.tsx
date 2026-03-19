"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

type PhoneFieldProps = {
	className?: string;
	error: string | null;
	inputId: string;
	registration: UseFormRegisterReturn;
};

export function PhoneField({
	className,
	error,
	inputId,
	registration,
}: PhoneFieldProps) {
	const messagesId = `${inputId}-messages`;

	return (
		<div
			className={`${error ? "fr-input-group fr-input-group--error" : "fr-input-group"}${className ? ` ${className}` : ""}`}
		>
			<label className="fr-label" htmlFor={inputId}>
				Numéro de téléphone (obligatoire)
				<span className="fr-hint-text">Format attendu : 01 22 33 44 55</span>
			</label>
			<input
				aria-describedby={messagesId}
				className="fr-input"
				id={inputId}
				type="tel"
				{...registration}
			/>
			<div aria-live="polite" className="fr-messages-group" id={messagesId}>
				{error && <p className="fr-message fr-message--error">{error}</p>}
			</div>
		</div>
	);
}

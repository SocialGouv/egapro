"use client";

import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { formatPhoneInput } from "~/modules/profile/phone";

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

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		event.target.value = formatPhoneInput(event.target.value);
		void registration.onChange(event);
	}

	return (
		<div
			className={`${error ? "fr-input-group fr-input-group--error" : "fr-input-group"}${className ? ` ${className}` : ""}`}
		>
			<label className="fr-label" htmlFor={inputId}>
				Numéro de téléphone (obligatoire)
				<span className="fr-hint-text">
					Format attendu : 01 22 33 44 55 ou +33 1 22 33 44 55
				</span>
			</label>
			<input
				aria-describedby={messagesId}
				autoComplete="tel"
				className="fr-input"
				id={inputId}
				type="tel"
				{...registration}
				onChange={handleChange}
			/>
			<div aria-live="polite" className="fr-messages-group" id={messagesId}>
				{error && <p className="fr-message fr-message--error">{error}</p>}
			</div>
		</div>
	);
}

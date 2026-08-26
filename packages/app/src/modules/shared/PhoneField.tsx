"use client";

import type { ChangeEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import {
	formatPhoneInput,
	PHONE_FORMAT_MESSAGE,
} from "~/modules/profile/phone";

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
	const showFormatHint = error !== PHONE_FORMAT_MESSAGE;

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		event.target.value = formatPhoneInput(event.target.value);
		void registration.onChange(event);
	}

	return (
		<div
			className={`${error ? "fr-input-group fr-input-group--error" : "fr-input-group"}${className ? ` ${className}` : ""}`}
		>
			<label className="fr-label" htmlFor={inputId}>
				Numéro de téléphone
				{showFormatHint && (
					<span className="fr-hint-text">{PHONE_FORMAT_MESSAGE}</span>
				)}
			</label>
			<input
				aria-describedby={messagesId}
				aria-invalid={error ? "true" : undefined}
				aria-required="true"
				autoComplete="tel"
				className="fr-input"
				id={inputId}
				type="tel"
				{...registration}
				onChange={handleChange}
			/>
			<div
				aria-atomic="true"
				aria-live="polite"
				className="fr-messages-group"
				id={messagesId}
			>
				{error && <p className="fr-message fr-message--error">{error}</p>}
			</div>
		</div>
	);
}

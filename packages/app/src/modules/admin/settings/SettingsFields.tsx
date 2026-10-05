import type { UseFormRegisterReturn } from "react-hook-form";

type SettingsDateFieldProps = {
	id: string;
	label: string;
	hint?: string;
	error: string | undefined;
	required: boolean;
	registration: UseFormRegisterReturn;
};

export function SettingsDateField({
	id,
	label,
	hint,
	error,
	required,
	registration,
}: SettingsDateFieldProps) {
	return (
		<div
			className={
				error ? "fr-input-group fr-input-group--error" : "fr-input-group"
			}
		>
			<label className="fr-label" htmlFor={id}>
				{label}
				{hint && <span className="fr-hint-text">{hint}</span>}
			</label>
			<input
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={Boolean(error)}
				className="fr-input"
				id={id}
				required={required}
				type="date"
				{...registration}
			/>
			{error && (
				<p className="fr-error-text" id={`${id}-error`}>
					{error}
				</p>
			)}
		</div>
	);
}

type SettingsReadOnlyFieldProps = {
	id: string;
	label: string;
	hint: string;
	type: "date" | "text";
	value: string;
};

export function SettingsReadOnlyField({
	id,
	label,
	hint,
	type,
	value,
}: SettingsReadOnlyFieldProps) {
	return (
		<div className="fr-input-group">
			<label className="fr-label" htmlFor={id}>
				{label}
				<span className="fr-hint-text">{hint}</span>
			</label>
			<input className="fr-input" id={id} readOnly type={type} value={value} />
		</div>
	);
}

export type SettingsFormStatus = "idle" | "success" | "error";

type SettingsFormFooterProps = {
	status: SettingsFormStatus;
	serverError: string | null;
	successMessage: string;
	isPending: boolean;
	submitDisabled: boolean;
};

export function SettingsFormFooter({
	status,
	serverError,
	successMessage,
	isPending,
	submitDisabled,
}: SettingsFormFooterProps) {
	return (
		<>
			{status === "success" && (
				<div
					aria-atomic="true"
					aria-live="polite"
					className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
				>
					<p>{successMessage}</p>
				</div>
			)}
			{status === "error" && serverError && (
				<div className="fr-alert fr-alert--error fr-mt-2w" role="alert">
					<p>{serverError}</p>
				</div>
			)}

			<ul className="fr-btns-group fr-btns-group--inline-sm fr-mt-2w">
				<li>
					<button
						className="fr-btn"
						disabled={isPending || submitDisabled}
						type="submit"
					>
						{isPending ? "Enregistrement…" : "Enregistrer"}
					</button>
				</li>
			</ul>
		</>
	);
}

type SettingsLoadErrorProps = {
	onRetry: () => void;
};

export function SettingsLoadError({ onRetry }: SettingsLoadErrorProps) {
	return (
		<div
			className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w"
			role="alert"
		>
			<p>
				Les valeurs enregistrées pour cette année n'ont pas pu être chargées.
				L'enregistrement est désactivé tant qu'elles ne sont pas disponibles.
			</p>
			<button
				className="fr-btn fr-btn--secondary fr-btn--sm fr-mt-2w"
				onClick={onRetry}
				type="button"
			>
				Réessayer
			</button>
		</div>
	);
}

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
			<input
				className="fr-input"
				defaultValue={value}
				id={id}
				key={value}
				readOnly
				type={type}
			/>
		</div>
	);
}

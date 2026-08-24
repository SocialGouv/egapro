"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldError, FieldErrorCategory } from "./types";
import { FIELD_ERROR_TITLES, fieldErrorAlertId } from "./types";

const CATEGORY_ORDER: FieldErrorCategory[] = [
	"empty",
	"invalid",
	"inconsistent",
];

function groupByCategory(
	errors: readonly FieldError[],
): Array<[FieldErrorCategory, FieldError[]]> {
	const groups: Array<[FieldErrorCategory, FieldError[]]> = [];
	for (const category of CATEGORY_ORDER) {
		const group = errors.filter((error) => error.category === category);
		if (group.length > 0) groups.push([category, group]);
	}
	return groups;
}

function ErrorMessage({ error }: { error: FieldError }) {
	if (!error.anchor) return <>{error.message}</>;
	return <a href={`#${error.fieldId}`}>{error.message}</a>;
}

function ErrorBody({ errors, id }: { errors: FieldError[]; id: string }) {
	const [only] = errors;
	if (errors.length === 1 && only) {
		return (
			<p id={id}>
				<ErrorMessage error={only} />
			</p>
		);
	}
	return (
		<ul id={id}>
			{errors.map((error) => (
				<li key={`${error.fieldId}-${error.message}`}>
					<ErrorMessage error={error} />
				</li>
			))}
		</ul>
	);
}

type Props = {
	/** Base id — each category gets `${id}-${category}` so inputs can point at it. */
	id: string;
	errors: readonly FieldError[];
};

/**
 * The single error surface of the declaration forms: a dismissible DSFR alert
 * rendered right under the table it belongs to, titled by error category and
 * naming each offending field. Offending inputs carry the error state and an
 * `aria-describedby` pointing here, never their own inline message (#4235).
 */
export function FieldErrorAlert({ id, errors }: Props) {
	const [dismissed, setDismissed] = useState(false);
	const firstAlertRef = useRef<HTMLDivElement | null>(null);

	// A fresh set of errors re-opens the alert and takes the focus: dismissing
	// one submission's feedback must never swallow the next one, and the alert
	// is the only place the message is written (RGAA 11.10).
	const signature = errors
		.map((error) => `${error.category}:${error.fieldId}:${error.message}`)
		.join("|");
	useEffect(() => {
		setDismissed(false);
		if (signature === "") return;
		requestAnimationFrame(() => firstAlertRef.current?.focus());
	}, [signature]);

	if (dismissed || errors.length === 0) return null;

	return (
		<>
			{groupByCategory(errors).map(([category, group], index) => (
				<div
					className="fr-alert fr-alert--error"
					key={category}
					ref={index === 0 ? firstAlertRef : undefined}
					role="alert"
					tabIndex={-1}
				>
					<h3 className="fr-alert__title">{FIELD_ERROR_TITLES[category]}</h3>
					<ErrorBody errors={group} id={fieldErrorAlertId(id, category)} />
					<button
						className="fr-btn--close fr-btn"
						onClick={() => setDismissed(true)}
						title="Masquer le message"
						type="button"
					>
						Masquer le message
					</button>
				</div>
			))}
		</>
	);
}

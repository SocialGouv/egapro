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

function ErrorMessage({
	error,
	onAnchorClick,
}: {
	error: FieldError;
	onAnchorClick?: (error: FieldError) => void;
}) {
	if (!error.anchor) return <>{error.message}</>;
	return (
		<a href={`#${error.fieldId}`} onClick={() => onAnchorClick?.(error)}>
			{error.message}
		</a>
	);
}

function ErrorBody({
	errors,
	id,
	onAnchorClick,
}: {
	errors: FieldError[];
	id: string;
	onAnchorClick?: (error: FieldError) => void;
}) {
	const [only] = errors;
	if (errors.length === 1 && only) {
		return (
			<p id={id}>
				<ErrorMessage error={only} onAnchorClick={onAnchorClick} />
			</p>
		);
	}
	return (
		<ul id={id}>
			{errors.map((error) => (
				<li key={`${error.fieldId}-${error.message}`}>
					<ErrorMessage error={error} onAnchorClick={onAnchorClick} />
				</li>
			))}
		</ul>
	);
}

type Props = {
	id: string;
	errors: readonly FieldError[];
	focusOnValidation?: boolean;
	onErrorAnchorClick?: (error: FieldError) => void;
	validationAttempt?: number;
};

export function FieldErrorAlert({
	id,
	errors,
	focusOnValidation = true,
	onErrorAnchorClick,
	validationAttempt = 0,
}: Props) {
	const [dismissedToken, setDismissedToken] = useState<string | null>(null);
	const firstAlertRef = useRef<HTMLDivElement | null>(null);
	const previousValidationAttemptRef = useRef(validationAttempt);

	const signature = errors
		.map((error) => `${error.category}:${error.fieldId}:${error.message}`)
		.join("|");
	const alertToken = `${validationAttempt}:${signature}`;
	const dismissed = dismissedToken === alertToken;

	useEffect(() => {
		const isNewValidationAttempt =
			previousValidationAttemptRef.current !== validationAttempt;
		previousValidationAttemptRef.current = validationAttempt;
		if (!isNewValidationAttempt || !focusOnValidation || signature === "")
			return;
		firstAlertRef.current?.focus();
	}, [focusOnValidation, signature, validationAttempt]);

	if (errors.length === 0) return null;

	if (dismissed) {
		return (
			<>
				{groupByCategory(errors).map(([category, group]) => (
					<div
						className="fr-sr-only"
						id={fieldErrorAlertId(id, category)}
						key={category}
					>
						{group.map((error) => error.message).join(" ")}
					</div>
				))}
			</>
		);
	}

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
					<ErrorBody
						errors={group}
						id={fieldErrorAlertId(id, category)}
						onAnchorClick={onErrorAnchorClick}
					/>
					<button
						className="fr-btn--close fr-btn"
						onClick={() => setDismissedToken(alertToken)}
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

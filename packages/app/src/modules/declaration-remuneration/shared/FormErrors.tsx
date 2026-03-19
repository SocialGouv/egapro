type FormErrorsProps = {
	mutationError?: string | null;
	validationError?: string | null;
};

export function FormErrors({
	validationError,
	mutationError,
}: FormErrorsProps) {
	return (
		<>
			{validationError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{validationError}</p>
				</div>
			)}
			{mutationError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{mutationError}</p>
				</div>
			)}
		</>
	);
}

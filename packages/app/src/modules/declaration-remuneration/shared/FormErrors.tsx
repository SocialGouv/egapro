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
				<div className="fr-alert fr-alert--error" role="alert">
					<p>{validationError}</p>
				</div>
			)}
			{mutationError && (
				<div className="fr-alert fr-alert--error" role="alert">
					<p>{mutationError}</p>
				</div>
			)}
		</>
	);
}

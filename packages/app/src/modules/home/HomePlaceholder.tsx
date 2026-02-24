/** Placeholder for sections still under design. */
export function HomePlaceholder() {
	return (
		<div
			style={{
				alignItems: "center",
				border: "1px solid var(--border-default-grey)",
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
				padding: "7.5rem 0",
			}}
		>
			<p
				className="fr-mb-0"
				style={{
					color: "var(--text-mention-grey)",
					fontSize: "2rem",
					fontWeight: 700,
					lineHeight: "2.5rem",
				}}
			>
				Section non finalisée
			</p>
			<p className="fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
				Cette section est encore en cours de conception et n'est pas prête pour
				le développement.
			</p>
		</div>
	);
}

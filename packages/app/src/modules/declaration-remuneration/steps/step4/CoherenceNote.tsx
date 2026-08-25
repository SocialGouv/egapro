import { type CoherenceError, coherenceErrorLabel } from "./quartileCoherence";
import type { TableType } from "./quartileErrors";

type Props = {
	tableType: TableType;
	errors: CoherenceError[];
};

// Stays mounted at load, otherwise assistive tech misses the announcement.
export function CoherenceNote({ tableType, errors }: Props) {
	const tableErrors = errors.filter((error) => error.table === tableType);
	return (
		<div aria-atomic="true" aria-live="polite">
			{tableErrors.length > 0 && (
				<div
					className="fr-alert fr-alert--error"
					id={`step4-coherence-${tableType}`}
					tabIndex={-1}
				>
					<h3 className="fr-alert__title">Nombre de salariés</h3>
					<ul>
						{tableErrors.map((error) => (
							<li key={error.field}>{coherenceErrorLabel(error)}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

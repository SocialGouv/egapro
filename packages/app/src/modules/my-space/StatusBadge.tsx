import type { DeclarationStatus } from "./types";

type Props = {
	status: DeclarationStatus;
};

const BADGE_CONFIG: Record<
	DeclarationStatus,
	{ label: string; className: string }
> = {
	to_complete: {
		label: "À compléter",
		className: "fr-badge fr-badge--sm fr-badge--warning fr-badge--no-icon",
	},
	in_progress: {
		label: "En cours",
		className: "fr-badge fr-badge--sm fr-badge--info fr-badge--no-icon",
	},
	done: {
		label: "Effectué",
		className: "fr-badge fr-badge--sm fr-badge--success",
	},
};

export function StatusBadge({ status }: Props) {
	const config = BADGE_CONFIG[status];
	return <span className={config.className}>{config.label}</span>;
}

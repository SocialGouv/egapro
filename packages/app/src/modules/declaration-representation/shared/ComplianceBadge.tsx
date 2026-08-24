import type { RepresentationComplianceVerdict } from "~/modules/domain";

const BADGE_BY_VERDICT: Record<
	RepresentationComplianceVerdict,
	{ className: string; label: string }
> = {
	compliant: {
		className: "fr-badge fr-badge--sm fr-badge--info fr-badge--no-icon",
		label: "Conforme",
	},
	non_compliant: {
		className: "fr-badge fr-badge--sm fr-badge--warning fr-badge--no-icon",
		label: "Non conforme",
	},
	not_applicable: {
		className: "fr-badge fr-badge--sm fr-badge--no-icon",
		label: "Non applicable",
	},
};

export function ComplianceBadge({
	verdict,
}: {
	verdict: RepresentationComplianceVerdict;
}) {
	const { className, label } = BADGE_BY_VERDICT[verdict];
	return <p className={className}>{label}</p>;
}

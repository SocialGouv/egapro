import {
	getRepresentationTarget,
	REPRESENTATION_OBLIGATION_FROM_CAMPAIGN_YEAR,
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import styles from "./GapReminderCallout.module.scss";

type GapReminderCalloutProps = {
	campaignYear: number;
	populationLabel: string;
	verdict: "compliant" | "non_compliant";
};

function gapReminderTitle(
	verdict: "compliant" | "non_compliant",
	target: number,
): string {
	return verdict === "compliant"
		? `Objectif de ${target} % atteint`
		: `Objectif de ${target} % non atteint`;
}

export function GapReminderCallout({
	campaignYear,
	populationLabel,
	verdict,
}: GapReminderCalloutProps) {
	const target = getRepresentationTarget(campaignYear);
	const reminderClassName =
		verdict === "compliant"
			? styles.reminderCompliant
			: styles.reminderNonCompliant;

	return (
		<div className={`fr-callout ${reminderClassName}`}>
			<p className="fr-callout__text">
				<strong>{gapReminderTitle(verdict, target)}</strong> Depuis le 1er mars{" "}
				{REPRESENTATION_OBLIGATION_FROM_CAMPAIGN_YEAR}, le sexe sous-représenté
				doit représenter au moins {REPRESENTATION_TARGET_INITIAL} %{" "}
				{populationLabel}. À partir du 1er mars{" "}
				{REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}, ce seuil passera à{" "}
				{REPRESENTATION_TARGET_RAISED} %.
			</p>
		</div>
	);
}

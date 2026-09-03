import { getRepresentationThresholdNotice } from "~/modules/domain";
import type { PublicRepresentationDTO } from "~/modules/public-api";
import { DataDetailsAccordion } from "~/modules/shared/DataDetailsAccordion";
import { StackedGenderBar } from "~/modules/shared/GenderBar";
import { IndicatorCard } from "~/modules/shared/IndicatorCard";
import { formatPercent } from "./formatters";
import { GenderDetailsTable } from "./GenderDetailsTable";
import styles from "./indicatorSection.module.scss";
import { NotComputableState } from "./NotComputableState";
import { INDICATOR_TOOLTIPS } from "./tooltips";

type Gap = {
	key: "executives" | "members";
	title: string;
	tooltip: string;
	womenPercent: number | null;
	menPercent: number | null;
	notComputableReason:
		| PublicRepresentationDTO["notComputableReasonExecutives"]
		| PublicRepresentationDTO["notComputableReasonMembers"];
};

type Props = { representation: PublicRepresentationDTO | null; year: number };

function toGaps(representation: PublicRepresentationDTO): Gap[] {
	return [
		{
			key: "executives",
			title: "Représentation parmi les cadres dirigeants",
			tooltip: INDICATOR_TOOLTIPS.executives,
			womenPercent: representation.executiveWomenPercent,
			menPercent: representation.executiveMenPercent,
			notComputableReason: representation.notComputableReasonExecutives,
		},
		{
			key: "members",
			title: "Représentation parmi les membres des instances dirigeantes",
			tooltip: INDICATOR_TOOLTIPS.members,
			womenPercent: representation.memberWomenPercent,
			menPercent: representation.memberMenPercent,
			notComputableReason: representation.notComputableReasonMembers,
		},
	];
}

function GapCard({ gap }: { gap: Gap }) {
	// A card with nothing to plot carries no help bubble either: the maquette
	// drops it, and an explanation of a formula no figure was produced by would
	// only invite the reader to look for a number that is not there.
	if (gap.notComputableReason) {
		return (
			<IndicatorCard title={gap.title}>
				<NotComputableState reason={gap.notComputableReason} />
			</IndicatorCard>
		);
	}

	return (
		<IndicatorCard
			title={gap.title}
			tooltip={{
				id: `tooltip-representation-${gap.key}`,
				label: `Aide sur la ${gap.title.toLowerCase()}`,
				text: gap.tooltip,
			}}
		>
			<StackedGenderBar
				menLabel={
					<>
						Hommes : <strong>{formatPercent(gap.menPercent)}</strong>
					</>
				}
				menPercent={gap.menPercent}
				womenLabel={
					<>
						Femmes : <strong>{formatPercent(gap.womenPercent)}</strong>
					</>
				}
				womenPercent={gap.womenPercent}
			/>
			<div className={styles.accordionSlot}>
				<DataDetailsAccordion id={`details-representation-${gap.key}`}>
					<GenderDetailsTable
						caption={`${gap.title} par sexe`}
						columns={["Femmes", "Hommes"]}
						rows={[
							{
								label: "Représentation",
								values: [
									formatPercent(gap.womenPercent),
									formatPercent(gap.menPercent),
								],
							},
						]}
					/>
				</DataDetailsAccordion>
			</div>
		</IndicatorCard>
	);
}

export function RepresentationTab({ representation, year }: Props) {
	if (!representation) {
		return (
			<div className="fr-alert fr-alert--info fr-mt-3w">
				<h3 className="fr-alert__title">
					Aucune déclaration de représentation équilibrée pour {year}
				</h3>
				<p>
					Cette entreprise n’a pas publié d’indicateurs de représentation pour
					cette année.
				</p>
			</div>
		);
	}

	return (
		<section aria-labelledby="representation-title" className={styles.section}>
			<h3 className={styles.title} id="representation-title">
				Écarts de représentation
			</h3>
			<p className={styles.threshold}>
				{getRepresentationThresholdNotice(representation.year)}
			</p>
			<div className={`${styles.cardGrid} fr-mt-2w`}>
				{toGaps(representation).map((gap) => (
					<GapCard gap={gap} key={gap.key} />
				))}
			</div>
		</section>
	);
}

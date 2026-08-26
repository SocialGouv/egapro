import { Fragment } from "react";
import type { PublicDeclarationDTO } from "~/modules/public-api";
import { DataDetailsAccordion } from "~/modules/shared/DataDetailsAccordion";
import { GenderBarRow, GenderBarSeparator } from "~/modules/shared/GenderBar";
import { IndicatorCard } from "~/modules/shared/IndicatorCard";
import { formatPercent, shareOf } from "./formatters";
import { GenderDetailsTable } from "./GenderDetailsTable";
import styles from "./indicatorSection.module.scss";
import { INDICATOR_TOOLTIPS } from "./tooltips";

const QUARTILES = [1, 2, 3, 4] as const;
const QUARTILE_LABELS = [
	"1ᵉʳ quartile",
	"2ᵉ quartile",
	"3ᵉ quartile",
	"4ᵉ quartile",
] as const;
const ALL_EMPLOYEES_LABEL = "Tous les salariés";

type Row = { label: string; women: number | null; men: number | null };

type Props = { declaration: PublicDeclarationDTO };

function buildRows(
	declaration: PublicDeclarationDTO,
	basis: "annual" | "hourly",
): Row[] {
	const rows: Row[] = QUARTILES.map((quartile, index) => ({
		label: QUARTILE_LABELS[index] ?? `${quartile}ᵉ quartile`,
		women: declaration[`${basis}Quartile${quartile}ProportionWomen`],
		men: declaration[`${basis}Quartile${quartile}ProportionMen`],
	}));

	// "Tous les salariés" is not stored per basis: it is the company-wide split,
	// identical under both, so it is derived from the headcounts.
	const total =
		declaration.totalWomen === null && declaration.totalMen === null
			? null
			: (declaration.totalWomen ?? 0) + (declaration.totalMen ?? 0);
	rows.push({
		label: ALL_EMPLOYEES_LABEL,
		women: shareOf(declaration.totalWomen, total),
		men: shareOf(declaration.totalMen, total),
	});

	return rows;
}

type CardProps = {
	basis: "annual" | "hourly";
	declaration: PublicDeclarationDTO;
};

function QuartileCard({ basis, declaration }: CardProps) {
	const rows = buildRows(declaration, basis);
	const isAnnual = basis === "annual";
	const title = isAnnual
		? "Rémunération annuelle brute moyenne"
		: "Rémunération horaire brute moyenne";

	return (
		<IndicatorCard
			title={title}
			tooltip={{
				id: `tooltip-quartiles-${basis}`,
				label: `Aide sur les quartiles de ${title.toLowerCase()}`,
				text: isAnnual
					? INDICATOR_TOOLTIPS.annualQuartiles
					: INDICATOR_TOOLTIPS.hourlyQuartiles,
			}}
		>
			<div>
				{rows.map((row, index) => (
					<Fragment key={row.label}>
						{index > 0 && <GenderBarSeparator />}
						<GenderBarRow
							label={row.label}
							menLabel={
								<>
									Hommes : <strong>{formatPercent(row.men)}</strong>
								</>
							}
							menPercent={row.men}
							womenLabel={
								<>
									Femmes : <strong>{formatPercent(row.women)}</strong>
								</>
							}
							womenPercent={row.women}
						/>
					</Fragment>
				))}
			</div>
			<div className={styles.accordionSlot}>
				<DataDetailsAccordion id={`details-quartiles-${basis}`}>
					<GenderDetailsTable
						caption={`Proportion de femmes et d’hommes par quartile de ${title.toLowerCase()}`}
						columns={["Femmes", "Hommes"]}
						rows={rows.map((row) => ({
							label: row.label,
							values: [formatPercent(row.women), formatPercent(row.men)],
						}))}
					/>
				</DataDetailsAccordion>
			</div>
		</IndicatorCard>
	);
}

export function QuartileSection({ declaration }: Props) {
	return (
		<section aria-labelledby="quartiles-title" className={styles.section}>
			<h3 className={styles.title} id="quartiles-title">
				Proportion de femmes et d’hommes dans chaque quartile de rémunération
			</h3>
			<div className={`${styles.cardGrid} fr-mt-2w`}>
				<QuartileCard basis="annual" declaration={declaration} />
				<QuartileCard basis="hourly" declaration={declaration} />
			</div>
		</section>
	);
}

import stepStyles from "../Step6Review.module.scss";
import { GapColumn } from "./GapColumn";

type Props = {
	annualMeanGap: number | null;
	annualMedianGap: number | null;
	hourlyMeanGap: number | null;
	hourlyMedianGap: number | null;
};

/** Side-by-side layout: Annuelle brute | separator | Horaire brute */
export function GapSideBySide({
	annualMeanGap,
	annualMedianGap,
	hourlyMeanGap,
	hourlyMedianGap,
}: Props) {
	return (
		<div className={stepStyles.sideBySide}>
			<GapColumn
				columns={[
					{ label: "Moyenne", gap: annualMeanGap },
					{ label: "Médiane", gap: annualMedianGap },
				]}
				title="Annuelle brute"
			/>
			<div className={stepStyles.verticalSeparator} />
			<GapColumn
				columns={[
					{ label: "Moyenne", gap: hourlyMeanGap },
					{ label: "Médiane", gap: hourlyMedianGap },
				]}
				title="Horaire brute"
			/>
		</div>
	);
}

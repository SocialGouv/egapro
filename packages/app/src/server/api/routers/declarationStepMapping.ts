import type {
	PayGapReferences,
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration";
import type { declarations } from "~/server/db/schema";

type DeclarationRow = typeof declarations.$inferSelect;

/**
 * Map a declaration row to the indicator-form step shapes (steps 2, 3, 4).
 * Same mapping regardless of caller — used by the in-flow declaration pages
 * (`etape/[step]/page.tsx`) and the post-submission recap.
 *
 * `step2Gaps`/`step3Gaps` carry the persisted gap of each row next to the operands it was
 * computed from, so every read-only surface (recap, PDF, admin) shows the gap that was actually
 * recorded and published rather than recomputing one that can drift from it.
 *
 * The `?? ""` (steps 2/3) and `?? undefined` (step 4) are intentional: DB
 * columns are nullable but the form types are `string` and `number?`
 * respectively. The coalescing is the explicit `null → form-shape`
 * conversion — without it TS rejects the assignment.
 */
export function mapToStepData(d: DeclarationRow): {
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
	step2Gaps: PayGapReferences;
	step3Gaps: PayGapReferences;
} {
	return {
		step2Gaps: [
			{
				women: d.indicatorAAnnualWomen,
				men: d.indicatorAAnnualMen,
				gap: d.globalAnnualMeanGap,
			},
			{
				women: d.indicatorAHourlyWomen,
				men: d.indicatorAHourlyMen,
				gap: d.globalHourlyMeanGap,
			},
			{
				women: d.indicatorCAnnualWomen,
				men: d.indicatorCAnnualMen,
				gap: d.globalAnnualMedianGap,
			},
			{
				women: d.indicatorCHourlyWomen,
				men: d.indicatorCHourlyMen,
				gap: d.globalHourlyMedianGap,
			},
		],
		step3Gaps: [
			{
				women: d.indicatorBAnnualWomen,
				men: d.indicatorBAnnualMen,
				gap: d.variableAnnualMeanGap,
			},
			{
				women: d.indicatorBHourlyWomen,
				men: d.indicatorBHourlyMen,
				gap: d.variableHourlyMeanGap,
			},
			{
				women: d.indicatorDAnnualWomen,
				men: d.indicatorDAnnualMen,
				gap: d.variableAnnualMedianGap,
			},
			{
				women: d.indicatorDHourlyWomen,
				men: d.indicatorDHourlyMen,
				gap: d.variableHourlyMedianGap,
			},
		],
		step2Data: {
			indicatorAAnnualWomen: d.indicatorAAnnualWomen ?? "",
			indicatorAAnnualMen: d.indicatorAAnnualMen ?? "",
			indicatorAHourlyWomen: d.indicatorAHourlyWomen ?? "",
			indicatorAHourlyMen: d.indicatorAHourlyMen ?? "",
			indicatorCAnnualWomen: d.indicatorCAnnualWomen ?? "",
			indicatorCAnnualMen: d.indicatorCAnnualMen ?? "",
			indicatorCHourlyWomen: d.indicatorCHourlyWomen ?? "",
			indicatorCHourlyMen: d.indicatorCHourlyMen ?? "",
		},
		step3Data: {
			indicatorBAnnualWomen: d.indicatorBAnnualWomen ?? "",
			indicatorBAnnualMen: d.indicatorBAnnualMen ?? "",
			indicatorBHourlyWomen: d.indicatorBHourlyWomen ?? "",
			indicatorBHourlyMen: d.indicatorBHourlyMen ?? "",
			indicatorDAnnualWomen: d.indicatorDAnnualWomen ?? "",
			indicatorDAnnualMen: d.indicatorDAnnualMen ?? "",
			indicatorDHourlyWomen: d.indicatorDHourlyWomen ?? "",
			indicatorDHourlyMen: d.indicatorDHourlyMen ?? "",
			indicatorEWomen: d.indicatorEWomen ?? "",
			indicatorEMen: d.indicatorEMen ?? "",
		},
		step4Data: {
			annual: [
				{
					threshold: d.indicatorFAnnualThreshold1 ?? "",
					women: d.indicatorFAnnualWomen1 ?? undefined,
					men: d.indicatorFAnnualMen1 ?? undefined,
				},
				{
					threshold: d.indicatorFAnnualThreshold2 ?? "",
					women: d.indicatorFAnnualWomen2 ?? undefined,
					men: d.indicatorFAnnualMen2 ?? undefined,
				},
				{
					threshold: d.indicatorFAnnualThreshold3 ?? "",
					women: d.indicatorFAnnualWomen3 ?? undefined,
					men: d.indicatorFAnnualMen3 ?? undefined,
				},
				{
					threshold: undefined,
					women: d.indicatorFAnnualWomen4 ?? undefined,
					men: d.indicatorFAnnualMen4 ?? undefined,
				},
			],
			hourly: [
				{
					threshold: d.indicatorFHourlyThreshold1 ?? "",
					women: d.indicatorFHourlyWomen1 ?? undefined,
					men: d.indicatorFHourlyMen1 ?? undefined,
				},
				{
					threshold: d.indicatorFHourlyThreshold2 ?? "",
					women: d.indicatorFHourlyWomen2 ?? undefined,
					men: d.indicatorFHourlyMen2 ?? undefined,
				},
				{
					threshold: d.indicatorFHourlyThreshold3 ?? "",
					women: d.indicatorFHourlyWomen3 ?? undefined,
					men: d.indicatorFHourlyMen3 ?? undefined,
				},
				{
					threshold: undefined,
					women: d.indicatorFHourlyWomen4 ?? undefined,
					men: d.indicatorFHourlyMen4 ?? undefined,
				},
			],
		},
	};
}

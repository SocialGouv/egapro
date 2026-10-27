import { expect, type Page, test } from "@playwright/test";
import { classifyCompanySize } from "~/modules/domain";

export type RecapNextStepsBlock =
	| "cse-inform"
	| "cse-inform-and-consult"
	| "afterward"
	| "gap-remediation"
	| "gap-compliance-process";

const CSE_INFORM_HEADING = "Rappel : Informer le CSE";
const CSE_CONSULT_HEADING = "Rappel : Informer et consulter le CSE";
const AFTERWARD_HEADING = "Et après ?";
const GAP_ACTIONS_HEADING = "Prochaines étapes : Actions à engager";
const COMPLIANCE_HELP_HEADING = "Pour vous aider";

async function expectHeading(page: Page, name: string, shown: boolean) {
	const heading = page.getByRole("heading", { name, exact: true });
	await (shown
		? expect(heading).toBeVisible()
		: expect(heading).toHaveCount(0));
}

// The two gap blocks share one heading; only the compliance one carries "Pour vous aider".
export async function expectRecapNextSteps(
	page: Page,
	blocks: ReadonlyArray<RecapNextStepsBlock>,
): Promise<void> {
	await test.step(`encart de fin de récapitulatif : ${blocks.join(" · ") || "aucun bloc"}`, async () => {
		const hasGapBlock =
			blocks.includes("gap-remediation") ||
			blocks.includes("gap-compliance-process");
		await expectHeading(
			page,
			CSE_INFORM_HEADING,
			blocks.includes("cse-inform"),
		);
		await expectHeading(
			page,
			CSE_CONSULT_HEADING,
			blocks.includes("cse-inform-and-consult"),
		);
		await expectHeading(page, AFTERWARD_HEADING, blocks.includes("afterward"));
		await expectHeading(page, GAP_ACTIONS_HEADING, hasGapBlock);
		await expect(
			page.getByText("Écarts détectés", { exact: true }),
		).toHaveCount(hasGapBlock ? 1 : 0);
		await expectHeading(
			page,
			COMPLIANCE_HELP_HEADING,
			blocks.includes("gap-compliance-process"),
		);
		if (blocks.includes("afterward") || blocks.includes("gap-remediation")) {
			await expect(
				page.getByRole("link", {
					name: /La négociation collective en entreprise en faveur de l.égalité professionnelle/,
				}),
			).toBeVisible();
		}
	});
}

export function belowHundredNextSteps(
	workforce: number,
	options: { hasGap: boolean },
): ReadonlyArray<RecapNextStepsBlock> {
	if (classifyCompanySize(workforce) === "voluntary") return ["afterward"];
	return ["cse-inform", options.hasGap ? "gap-remediation" : "afterward"];
}

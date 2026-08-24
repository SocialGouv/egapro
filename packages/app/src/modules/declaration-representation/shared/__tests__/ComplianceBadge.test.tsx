import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { RepresentationComplianceVerdict } from "~/modules/domain";
import { ComplianceBadge } from "../ComplianceBadge";

const CASES: Array<[RepresentationComplianceVerdict, string, string]> = [
	["compliant", "Conforme", "fr-badge--info"],
	["non_compliant", "Non conforme", "fr-badge--warning"],
	["not_applicable", "Non applicable", ""],
];

describe("ComplianceBadge", () => {
	it.each(
		CASES,
	)("renders the %s verdict as « %s »", (verdict, label, modifier) => {
		render(<ComplianceBadge verdict={verdict} />);

		const badge = screen.getByText(label);
		expect(badge).toHaveClass("fr-badge", "fr-badge--sm");
		if (modifier) expect(badge).toHaveClass(modifier);
	});

	it("keeps the not_applicable badge neutral", () => {
		render(<ComplianceBadge verdict="not_applicable" />);

		const badge = screen.getByText("Non applicable");
		expect(badge).not.toHaveClass("fr-badge--info");
		expect(badge).not.toHaveClass("fr-badge--warning");
	});
});

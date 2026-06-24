import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompliancePathReadOnlyAlert } from "../compliancePath/CompliancePathReadOnlyAlert";
import type { CompliancePathReadOnlyReason } from "../compliancePath/constants";

const CASES: Array<[CompliancePathReadOnlyReason, RegExp]> = [
	["demarche_completed", /Votre démarche est finalisée/],
	["cse_opinion_submitted", /L'avis du CSE a déjà été transmis/],
	["second_declaration_submitted", /La seconde déclaration a déjà été soumise/],
	[
		"joint_evaluation_submitted",
		/Le rapport d'évaluation conjointe a déjà été transmis/,
	],
	[
		"modification_deadline_passed",
		/La date limite de modification de votre déclaration est dépassée/,
	],
];

describe("CompliancePathReadOnlyAlert", () => {
	it.each(CASES)("renders the %s message", (reason, pattern) => {
		render(<CompliancePathReadOnlyAlert reason={reason} />);
		expect(screen.getByText(pattern)).toBeInTheDocument();
	});
});

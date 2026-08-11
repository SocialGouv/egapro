import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GIP_WORKFORCE_ABSENT_DISPLAY } from "~/modules/domain";
import { CompanyPreviewCard } from "../CompanyPreviewCard";

describe("CompanyPreviewCard", () => {
	it("renders all company fields when present", () => {
		render(
			<CompanyPreviewCard
				company={{
					siren: "123456789",
					name: "ACME",
					address: "10 Rue de la Paix",
					nafCode: "62.01Z",
					workforce: 42,
				}}
			/>,
		);
		expect(screen.getByText("ACME")).toBeInTheDocument();
		expect(screen.getByText("123456789")).toBeInTheDocument();
		expect(screen.getByText("10 Rue de la Paix")).toBeInTheDocument();
		expect(screen.getByText("62.01Z")).toBeInTheDocument();
		// 42 is voluntary tier: the exact headcount is bracketed here too.
		expect(screen.getByText(GIP_WORKFORCE_ABSENT_DISPLAY)).toBeInTheDocument();
	});

	it("omits optional fields when null", () => {
		render(
			<CompanyPreviewCard
				company={{
					siren: "123456789",
					name: "ACME",
					address: null,
					nafCode: null,
					workforce: null,
				}}
			/>,
		);
		expect(screen.queryByText(/Adresse/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Code NAF/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Effectif/)).not.toBeInTheDocument();
	});

	it("brackets a zero headcount rather than hiding the row", () => {
		render(
			<CompanyPreviewCard
				company={{
					siren: "123456789",
					name: "ACME",
					address: null,
					nafCode: null,
					workforce: 0,
				}}
			/>,
		);
		expect(screen.getByText(GIP_WORKFORCE_ABSENT_DISPLAY)).toBeInTheDocument();
	});

	it("keeps the exact headcount above the voluntary threshold", () => {
		render(
			<CompanyPreviewCard
				company={{
					siren: "123456789",
					name: "ACME",
					address: null,
					nafCode: null,
					workforce: 250,
				}}
			/>,
		);
		expect(screen.getByText("250")).toBeInTheDocument();
	});
});

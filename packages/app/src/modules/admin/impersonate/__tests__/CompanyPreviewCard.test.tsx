import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
		expect(screen.getByText("42")).toBeInTheDocument();
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

	it("renders workforce of 0", () => {
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
		expect(screen.getByText("0")).toBeInTheDocument();
	});
});

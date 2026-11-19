import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProbeTable } from "../ProbeTable";
import { NOW, serviceProbe } from "./fixtures";

describe("ProbeTable", () => {
	it("renders a captioned table with column headers", () => {
		render(<ProbeTable probes={[]} referenceTime={NOW} />);

		const table = screen.getByRole("table", {
			name: /Sondes de service/,
		});
		const headers = within(table).getAllByRole("columnheader");

		expect(headers.map((header) => header.textContent)).toEqual([
			"Service",
			"Criticité",
			"État",
			"Dernière vérification",
			"Latence",
			"Depuis",
			"Dernier message",
		]);
		for (const header of headers) {
			expect(header).toHaveAttribute("scope", "col");
		}
	});

	it("carries every state as a label, never colour alone", () => {
		render(
			<ProbeTable
				probes={[serviceProbe({ status: "unavailable", lastError: "timeout" })]}
				referenceTime={NOW}
			/>,
		);

		const badge = screen.getByText("Indisponible");
		expect(badge).toHaveClass("fr-badge", "fr-badge--error");
		expect(screen.getByText("Critique")).toBeInTheDocument();
		expect(screen.getByText("timeout")).toBeInTheDocument();
	});

	it("shows the unknown status of a stale probe", () => {
		render(
			<ProbeTable
				probes={[serviceProbe({ status: "unknown" })]}
				referenceTime={NOW}
			/>,
		);

		expect(screen.getByText("Inconnu")).toBeInTheDocument();
		expect(screen.queryByText("Opérationnel")).not.toBeInTheDocument();
	});

	it("names an empty inventory instead of rendering an empty table body", () => {
		render(<ProbeTable probes={[]} referenceTime={NOW} />);

		expect(
			screen.getByText("Aucune sonde de service enregistrée."),
		).toBeInTheDocument();
	});
});

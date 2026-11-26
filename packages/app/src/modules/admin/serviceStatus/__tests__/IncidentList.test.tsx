import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IncidentList } from "../IncidentList";
import { NOW } from "./fixtures";

const incident = {
	id: "incident-1",
	probeKey: "postgres-app",
	probeLabel: "PostgreSQL (application)",
	fromStatus: "operational" as const,
	toStatus: "unavailable" as const,
	startedAt: NOW,
	endedAt: null,
	lastError: "timeout after 5000 ms",
};

describe("IncidentList", () => {
	it("states that nothing happened when the window is empty", () => {
		render(<IncidentList incidents={[]} />);

		expect(
			screen.getByText("Aucun incident enregistré sur les 30 derniers jours."),
		).toBeInTheDocument();
	});

	it("lists an ongoing incident with its transition and message", () => {
		render(<IncidentList incidents={[incident]} />);

		const table = screen.getByRole("table", {
			name: /Incidents des 30 derniers jours/,
		});
		expect(within(table).getByText("PostgreSQL (application)")).toBeVisible();
		expect(
			within(table).getByText("Opérationnel → Indisponible"),
		).toBeInTheDocument();
		expect(within(table).getByText("En cours")).toBeInTheDocument();
		expect(
			within(table).getByText("timeout after 5000 ms"),
		).toBeInTheDocument();
	});

	it("prints the end of a closed incident", () => {
		render(
			<IncidentList
				incidents={[{ ...incident, endedAt: new Date("2026-11-19T11:00:00Z") }]}
			/>,
		);

		expect(screen.queryByText("En cours")).not.toBeInTheDocument();
	});
});

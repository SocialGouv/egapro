import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatShortDateTime } from "~/modules/domain";

import { ScheduledJobTable } from "../ScheduledJobTable";
import { scheduledJob } from "./fixtures";

describe("ScheduledJobTable", () => {
	it("renders a captioned table with the job columns", () => {
		render(<ScheduledJobTable jobs={[]} />);

		const table = screen.getByRole("table", {
			name: /Traitements planifiés/,
		});
		const headers = within(table).getAllByRole("columnheader");

		expect(headers.map((header) => header.textContent)).toEqual([
			"Traitement",
			"Criticité",
			"État",
			"Dernier succès",
			"Dernier échec",
			"Prochaine exécution attendue",
			"Dernier message",
		]);
		for (const header of headers) {
			expect(header).toHaveAttribute("scope", "col");
		}
	});

	it("prints the last success, the last failure and the next expected run", () => {
		const job = scheduledJob();

		render(<ScheduledJobTable jobs={[job]} />);

		expect(screen.getByText("À jour")).toBeInTheDocument();
		if (job.lastSuccessAt) {
			expect(
				screen.getByText(formatShortDateTime(job.lastSuccessAt)),
			).toBeInTheDocument();
		}
		if (job.nextExpectedAt) {
			expect(
				screen.getByText(formatShortDateTime(job.nextExpectedAt)),
			).toBeInTheDocument();
		}
		expect(screen.getByText("Import GIP-MDS")).toBeInTheDocument();
	});

	it("labels a late job as such and keeps its error message", () => {
		render(
			<ScheduledJobTable
				jobs={[
					scheduledJob({
						status: "unknown",
						lastError: "en retard — dernier succès il y a 27 h",
					}),
				]}
			/>,
		);

		expect(screen.getByText("Inconnu")).toBeInTheDocument();
		expect(
			screen.getByText("en retard — dernier succès il y a 27 h"),
		).toBeInTheDocument();
	});

	it("names an empty inventory instead of rendering an empty table body", () => {
		render(<ScheduledJobTable jobs={[]} />);

		expect(
			screen.getByText("Aucun traitement planifié enregistré."),
		).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../HistoryEntry";
import { HistoryEntry } from "../HistoryEntry";

const baseItem: HistoryItem = {
	id: "item-1",
	eventType: "submit",
	value: null,
	round: null,
	createdAt: new Date("2026-09-28T13:10:00Z"),
	actor: {
		firstName: "Maria",
		lastName: "Dupont",
		email: "maria.dupont@example.fr",
	},
};

describe("HistoryEntry", () => {
	it("renders actor name and email", () => {
		render(
			<ul>
				<HistoryEntry item={baseItem} />
			</ul>,
		);
		expect(screen.getByText("Maria Dupont")).toBeInTheDocument();
		expect(screen.getByText("maria.dupont@example.fr")).toBeInTheDocument();
	});

	it("renders page link for submit event", () => {
		render(
			<ul>
				<HistoryEntry item={baseItem} />
			</ul>,
		);
		const link = screen.getByRole("link", {
			name: "Récapitulatif de votre déclaration",
		});
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"/declaration-remuneration/recapitulatif",
		);
	});

	it("renders 'Système' when actor is null", () => {
		render(
			<ul>
				<HistoryEntry item={{ ...baseItem, actor: null }} />
			</ul>,
		);
		expect(screen.getByText("Système")).toBeInTheDocument();
	});

	it("renders actor email as name when firstName and lastName are null", () => {
		render(
			<ul>
				<HistoryEntry
					item={{
						...baseItem,
						actor: { firstName: null, lastName: null, email: "only@email.fr" },
					}}
				/>
			</ul>,
		);
		expect(screen.getAllByText("only@email.fr").length).toBeGreaterThan(0);
	});

	it("renders the action label as plain text when the event has no page", () => {
		render(
			<ul>
				<HistoryEntry item={{ ...baseItem, eventType: "cancel" }} />
			</ul>,
		);
		expect(
			screen.getByText("Annulation de la déclaration"),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /annulation/i }),
		).not.toBeInTheDocument();
	});

	it("renders step page link for step_change event with round", () => {
		render(
			<ul>
				<HistoryEntry
					item={{ ...baseItem, eventType: "step_change", round: 1 }}
				/>
			</ul>,
		);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute(
			"href",
			expect.stringContaining("/declaration-remuneration/etape/"),
		);
	});

	it("renders date and time in the time element", () => {
		render(
			<ul>
				<HistoryEntry item={baseItem} />
			</ul>,
		);
		const timeEl = screen.getByRole("time");
		expect(timeEl).toHaveAttribute("dateTime", "2026-09-28T13:10:00.000Z");
	});
});

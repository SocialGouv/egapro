import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	type SubmissionAlertSnapshot,
	SubmissionAlerts,
} from "../SubmissionAlerts";

const SNAPSHOT: SubmissionAlertSnapshot = {
	attempt: 1,
	noFile: false,
	missing: [
		{ id: "a", message: "Avis A manquant" },
		{ id: "b", message: "Avis B manquant" },
	],
	unassociated: true,
};

function renderAlerts(
	overrides: Partial<React.ComponentProps<typeof SubmissionAlerts>> = {},
) {
	return render(
		<SubmissionAlerts
			snapshot={SNAPSHOT}
			stillMissingIds={new Set(["a", "b"])}
			stillNoFile={false}
			stillUnassociated
			{...overrides}
		/>,
	);
}

describe("SubmissionAlerts", () => {
	it("announces every frozen error in one focused alert", () => {
		renderAlerts();

		const alert = screen.getByRole("alert");
		expect(alert).toHaveFocus();
		expect(alert).toHaveTextContent("Avis A manquant");
		expect(alert).toHaveTextContent("Avis B manquant");
		expect(alert).toHaveTextContent("Type d'avis non renseigné");
	});

	it("drops the entries that are no longer outstanding", () => {
		renderAlerts({
			stillMissingIds: new Set(["b"]),
			stillUnassociated: false,
		});

		const alert = screen.getByRole("alert");
		expect(alert).not.toHaveTextContent("Avis A manquant");
		expect(alert).toHaveTextContent("Avis B manquant");
		expect(alert).not.toHaveTextContent("Type d'avis non renseigné");
	});

	it("never adds an entry that was not part of the snapshot", () => {
		renderAlerts({
			stillMissingIds: new Set(["a", "b", "c"]),
			stillNoFile: true,
		});

		const alert = screen.getByRole("alert");
		expect(alert).not.toHaveTextContent("Aucun avis déposé");
		expect(alert).not.toHaveTextContent("Avis C");
	});

	it("renders nothing once every frozen error is resolved", () => {
		renderAlerts({
			stillMissingIds: new Set(),
			stillUnassociated: false,
		});

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TermsOfUsePage } from "../TermsOfUsePage";
import type { TermsOfUseVersion } from "../TermsOfUsePage/termsOfUseVersions";

function FakeContent() {
	return <p>Texte figé de la version</p>;
}

const CURRENT: TermsOfUseVersion = {
	effectiveDate: "2026-10-12",
	Content: FakeContent,
};
const ARCHIVE: TermsOfUseVersion = {
	effectiveDate: "2025-01-15",
	Content: FakeContent,
};
const VERSIONS: readonly TermsOfUseVersion[] = [CURRENT, ARCHIVE];

describe("TermsOfUsePage", () => {
	it("renders the in-force version with its date, an anchor to the history, and no archive banner", () => {
		render(<TermsOfUsePage isCurrent version={CURRENT} versions={VERSIONS} />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Conditions générales d'utilisation",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("En vigueur à partir du 12/10/2026"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Consulter l'historique des versions" }),
		).toHaveAttribute("href", "#historique-des-versions");
		expect(screen.getByText("Texte figé de la version")).toBeInTheDocument();
		expect(
			screen.queryByText("Cette version n'est plus en vigueur."),
		).not.toBeInTheDocument();
	});

	it("renders an archived version with its date, the inactive banner, and a link back to the in-force version", () => {
		render(
			<TermsOfUsePage
				isCurrent={false}
				version={ARCHIVE}
				versions={VERSIONS}
			/>,
		);

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading.nextElementSibling).toHaveTextContent(
			"Version du 15/01/2025",
		);
		expect(
			screen.getByText("Cette version n'est plus en vigueur."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Consulter la version en vigueur" }),
		).toHaveAttribute("href", "/cgu");
		expect(
			screen.queryByRole("link", {
				name: "Consulter l'historique des versions",
			}),
		).not.toBeInTheDocument();
	});

	it("always renders the version history, with the currently viewed version left unlinked", () => {
		render(
			<TermsOfUsePage
				isCurrent={false}
				version={ARCHIVE}
				versions={VERSIONS}
			/>,
		);

		const historyHeading = screen.getByRole("heading", {
			name: "Historique des versions",
		});
		const historyList = within(
			historyHeading.nextElementSibling as HTMLElement,
		);
		expect(
			historyList.getByRole("link", {
				name: "Version du 12/10/2026 (en vigueur)",
			}),
		).toHaveAttribute("href", "/cgu");
		expect(historyList.getByText("Version du 15/01/2025")).toBeInTheDocument();
		expect(
			historyList.queryByRole("link", { name: /15\/01\/2025/ }),
		).not.toBeInTheDocument();
	});
});

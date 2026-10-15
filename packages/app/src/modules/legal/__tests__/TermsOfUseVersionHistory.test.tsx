import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TermsOfUseVersionHistory } from "../TermsOfUsePage/TermsOfUseVersionHistory";
import type { TermsOfUseVersion } from "../TermsOfUsePage/termsOfUseVersions";

function FakeContent() {
	return null;
}

const TWO_VERSIONS: readonly TermsOfUseVersion[] = [
	{ effectiveDate: "2026-10-12", Content: FakeContent },
	{ effectiveDate: "2025-01-15", Content: FakeContent },
];

const THREE_VERSIONS: readonly TermsOfUseVersion[] = [
	{ effectiveDate: "2027-03-01", Content: FakeContent },
	{ effectiveDate: "2026-10-12", Content: FakeContent },
	{ effectiveDate: "2025-01-15", Content: FakeContent },
];

describe("TermsOfUseVersionHistory", () => {
	it("shows the current version as in force, linked to /cgu, and the archive as plain text while it is being viewed", () => {
		render(
			<TermsOfUseVersionHistory
				versions={TWO_VERSIONS}
				viewedEffectiveDate="2025-01-15"
			/>,
		);

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(2);

		const currentLink = screen.getByRole("link", {
			name: "Version du 12/10/2026 (en vigueur)",
		});
		expect(currentLink).toHaveAttribute("href", "/cgu");

		expect(
			screen.queryByRole("link", { name: /15\/01\/2025/ }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Version du 15/01/2025")).toBeInTheDocument();
	});

	it("shows the version in force as plain text while viewing it, and links every archive to its own page", () => {
		render(
			<TermsOfUseVersionHistory
				versions={TWO_VERSIONS}
				viewedEffectiveDate="2026-10-12"
			/>,
		);

		expect(
			screen.queryByRole("link", { name: /\(en vigueur\)/ }),
		).not.toBeInTheDocument();
		expect(
			screen.getByText("Version du 12/10/2026 (en vigueur)"),
		).toBeInTheDocument();

		const archiveLink = screen.getByRole("link", {
			name: "Version du 15/01/2025",
		});
		expect(archiveLink).toHaveAttribute("href", "/cgu/2025-01-15");
	});

	it("links every version to its own archive href, each at its own date", () => {
		render(
			<TermsOfUseVersionHistory
				versions={THREE_VERSIONS}
				viewedEffectiveDate="2026-10-12"
			/>,
		);

		expect(
			screen.getByRole("link", { name: "Version du 01/03/2027 (en vigueur)" }),
		).toHaveAttribute("href", "/cgu");
		expect(
			screen.getByRole("link", { name: "Version du 15/01/2025" }),
		).toHaveAttribute("href", "/cgu/2025-01-15");
		expect(screen.getByText("Version du 12/10/2026")).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeclarationSuccessBanner } from "../DeclarationSuccessBanner";

vi.mock("~/trpc/react", () => ({
	api: {
		mail: {
			resendReceipt: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

const MODIFICATION_DEADLINE = new Date("2027-03-01");

function renderBanner(
	overrides: Partial<
		React.ComponentProps<typeof DeclarationSuccessBanner>
	> = {},
) {
	return render(
		<DeclarationSuccessBanner
			email="test@example.fr"
			modificationDeadline={MODIFICATION_DEADLINE}
			year={2026}
			{...overrides}
		/>,
	);
}

describe("DeclarationSuccessBanner", () => {
	it("announces the first declaration and its modification deadline", () => {
		renderBanner();

		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
		expect(screen.getByText("1ᵉʳ mars 2027")).toBeInTheDocument();
	});

	it("announces the second declaration when it is one", () => {
		renderBanner({ isSecondDeclaration: true });

		expect(
			screen.getByText("Votre seconde déclaration a été transmise"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Votre déclaration a été transmise"),
		).not.toBeInTheDocument();
	});

	it("shows the recipient address of the receipt", () => {
		renderBanner({ email: "john@company.fr" });

		expect(screen.getByText("john@company.fr")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Renvoyer l'accusé de réception" }),
		).toBeInTheDocument();
	});

	it("greys out the spam notice with the real DSFR utility class", () => {
		renderBanner();

		expect(screen.getByText(/vérifiez vos courriers indésirables/)).toHaveClass(
			"fr-text-mention--grey",
		);
	});

	it("hides the download link when no recapitulative PDF is available", () => {
		renderBanner();

		expect(
			screen.queryByRole("link", { name: /Télécharger le récapitulatif/ }),
		).not.toBeInTheDocument();
	});

	it.each([
		[false, "Télécharger le récapitulatif de la déclaration des indicateurs"],
		[
			true,
			"Télécharger le récapitulatif de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés",
		],
	])("links to the recapitulative PDF when available (isSecondDeclaration: %s)", (isSecondDeclaration, label) => {
		renderBanner({ isSecondDeclaration, pdfDownloadHref: "/pdf/2026" });

		// `fr-link__detail` lives inside the anchor, so the format is part of the
		// accessible name — that is the DSFR download-link contract.
		expect(screen.getByRole("link", { name: `${label} PDF` })).toHaveAttribute(
			"href",
			"/pdf/2026",
		);
	});

	it("lays the two columns out without the DSFR gutter grid, whose negative margin overflows the banner background", () => {
		const { container } = renderBanner();

		const banner = container.firstElementChild as HTMLElement;

		expect(banner).toHaveClass("fr-background-alt--blue-france");
		expect(banner).not.toHaveClass("fr-grid-row");
		expect(banner).not.toHaveClass("fr-grid-row--gutters");
		expect(banner.querySelector(".fr-col-md-6")).toBeNull();
	});
});

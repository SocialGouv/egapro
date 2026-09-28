import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedbackBanner } from "../FeedbackBanner";

const FEEDBACK_URL =
	"https://jedonnemonavis.numerique.gouv.fr/Demarches/4169?button=4730";

describe("FeedbackBanner", () => {
	afterEach(() => {
		vi.doUnmock("~/env");
		vi.resetModules();
	});

	it("renders the feedback prompt", () => {
		render(<FeedbackBanner />);

		expect(
			screen.getByText("Comment s'est passée votre démarche ?"),
		).toBeInTheDocument();
	});

	it("links to the official jedonnemonavis démarche in a new tab", () => {
		render(<FeedbackBanner />);

		const link = screen.getByRole("link", { name: /Je donne mon avis/ });
		expect(link).toHaveAttribute("href", FEEDBACK_URL);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("serves the button image from the local asset", () => {
		render(<FeedbackBanner />);

		const image = screen.getByRole("img", { name: "Je donne mon avis" });
		expect(image).toHaveAttribute(
			"data-src",
			"/assets/images/je-donne-mon-avis.svg",
		);
	});

	it("announces that the link opens a new window", () => {
		render(<FeedbackBanner />);

		expect(screen.getByText(/ouvre une nouvelle fenêtre/i)).toBeInTheDocument();
	});

	it("merges a custom className onto the root while keeping the banner class", () => {
		const { container } = render(<FeedbackBanner className="fr-mb-4w" />);

		expect(container.firstChild).toHaveClass("banner", "fr-mb-4w");
	});

	it("builds the href from the configured JDMA env identifiers", async () => {
		vi.resetModules();
		vi.doMock("~/env", () => ({
			env: { EGAPRO_JDMA_DEMARCHE_ID: "9999", EGAPRO_JDMA_BUTTON_ID: "8888" },
		}));

		const { FeedbackBanner: ConfiguredBanner } = await import(
			"../FeedbackBanner"
		);
		render(<ConfiguredBanner />);

		expect(
			screen.getByRole("link", { name: /Je donne mon avis/ }),
		).toHaveAttribute(
			"href",
			"https://jedonnemonavis.numerique.gouv.fr/Demarches/9999?button=8888",
		);
	});
});

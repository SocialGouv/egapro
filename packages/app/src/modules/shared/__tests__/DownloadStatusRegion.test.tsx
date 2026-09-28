import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getLiveRegion } from "~/test/downloadHelpers";
import { DownloadStatusRegion } from "../DownloadStatusRegion";

const PENDING_LABEL = "Génération du récapitulatif en cours…";
const ERROR_MESSAGE = "Le téléchargement a échoué, réessayez.";

describe("DownloadStatusRegion", () => {
	it("keeps a silent polite region while idle", () => {
		const { container } = render(
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state="idle" />,
		);

		const liveRegion = getLiveRegion(container);
		expect(liveRegion).toBeInTheDocument();
		expect(liveRegion).toBeEmptyDOMElement();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("announces the pending label politely and atomically", () => {
		const { container } = render(
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state="pending" />,
		);

		const liveRegion = getLiveRegion(container);
		expect(liveRegion).toHaveTextContent(PENDING_LABEL);
		expect(liveRegion).toHaveAttribute("aria-atomic", "true");
		expect(liveRegion).toHaveClass("fr-sr-only");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("carries no role of its own, so it never double-declares a live region", () => {
		const { container } = render(
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state="pending" />,
		);

		expect(getLiveRegion(container)).not.toHaveAttribute("role");
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("reports a failure in an alert and stops announcing progress", () => {
		const { container } = render(
			<DownloadStatusRegion pendingLabel={PENDING_LABEL} state="error" />,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(ERROR_MESSAGE);
		expect(getLiveRegion(container)).toBeEmptyDOMElement();
	});
});

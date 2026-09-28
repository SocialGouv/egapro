import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

import { SubmissionBanner } from "../SubmissionBanner";

describe("SubmissionBanner", () => {
	it("uses the DSFR mention color for the fallback instruction", () => {
		render(
			<SubmissionBanner
				deadline={new Date("2026-08-01T00:00:00Z")}
				email="declarant@example.fr"
				year={2026}
			/>,
		);

		expect(screen.getByText(/vérifiez vos courriers indésirables/)).toHaveClass(
			"fr-text-mention--grey",
		);
	});
});

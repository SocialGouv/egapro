import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AideCallout } from "../AideCallout";

describe("AideCallout", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each([
		"America/Cayenne",
		"Pacific/Tahiti",
	])("shows the civil deadline day under %s", (timeZone) => {
		vi.stubEnv("TZ", timeZone);
		render(
			<AideCallout deadline={new Date("2026-06-01T00:00:00Z")} year={2026} />,
		);

		expect(screen.getByText("1ᵉʳ juin 2026")).toBeInTheDocument();
	});
});

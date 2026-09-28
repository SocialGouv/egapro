import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		NEXT_PUBLIC_MATOMO_URL: "https://matomo.test" as string | undefined,
	},
}));

vi.mock("~/env", () => ({ env: mockEnv }));

import { MatomoOptOut } from "../MatomoOptOut";

beforeEach(() => {
	mockEnv.NEXT_PUBLIC_MATOMO_URL = "https://matomo.test";
});

describe("MatomoOptOut", () => {
	it("embeds the Matomo opt-out iframe pointing at the configured instance", () => {
		mockEnv.NEXT_PUBLIC_MATOMO_URL = "https://matomo.test/";

		const { getByTitle } = render(<MatomoOptOut />);
		const iframe = getByTitle(/mesure d'audience/i);

		// Trailing slash is normalised away.
		expect(iframe).toHaveAttribute(
			"src",
			"https://matomo.test/index.php?module=CoreAdminHome&action=optOut&language=fr",
		);
	});

	it("renders nothing when Matomo is not configured", () => {
		mockEnv.NEXT_PUBLIC_MATOMO_URL = undefined;

		const { container } = render(<MatomoOptOut />);

		expect(container).toBeEmptyDOMElement();
	});
});

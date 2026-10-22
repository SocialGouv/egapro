import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
	default: ({
		children,
		id,
		nonce,
		strategy,
	}: {
		children?: ReactNode;
		id?: string;
		nonce?: string;
		strategy?: string;
	}) => (
		<script
			data-nonce={nonce}
			data-strategy={strategy}
			data-testid="next-script"
			id={id}
		>
			{children}
		</script>
	),
}));

import { CampaignYearInitScript } from "../CampaignYearInitScript";

describe("CampaignYearInitScript", () => {
	it("renders nothing when no campaign year is pinned", () => {
		const { container } = render(
			<CampaignYearInitScript nonce="nonce-value" year={undefined} />,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("pins the browser campaign year before hydration when a year is set", () => {
		const { getByTestId } = render(
			<CampaignYearInitScript nonce="nonce-value" year={2030} />,
		);

		const script = getByTestId("next-script");
		expect(script).toHaveAttribute("id", "campaign-year-init");
		expect(script).toHaveAttribute("data-nonce", "nonce-value");
		expect(script).toHaveAttribute("data-strategy", "beforeInteractive");
		expect(script.textContent).toBe("window.__egaproCampaignYear=2030;");
	});
});

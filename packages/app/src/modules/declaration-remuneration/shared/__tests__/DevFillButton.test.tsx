import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DevFillButton } from "../DevFillButton";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev" },
}));

describe("DevFillButton", () => {
	it("renders button with label when env is dev", () => {
		render(<DevFillButton onFill={vi.fn()} />);
		expect(
			screen.getByRole("button", { name: "[DEV] Remplir" }),
		).toBeInTheDocument();
	});

	it("calls onFill when clicked", async () => {
		const onFill = vi.fn();
		render(<DevFillButton onFill={onFill} />);

		await userEvent.click(
			screen.getByRole("button", { name: "[DEV] Remplir" }),
		);

		expect(onFill).toHaveBeenCalledOnce();
	});

	it("renders nothing when env is not dev", async () => {
		const { env } = await import("~/env");
		(env as Record<string, string>).NEXT_PUBLIC_EGAPRO_ENV = "preprod";

		const { container } = render(<DevFillButton onFill={vi.fn()} />);
		expect(container.innerHTML).toBe("");

		// Restore for other tests
		(env as Record<string, string>).NEXT_PUBLIC_EGAPRO_ENV = "dev";
	});
});

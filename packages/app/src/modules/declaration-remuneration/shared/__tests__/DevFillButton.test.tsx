import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "~/env";

import { DevFillButton } from "../DevFillButton";

vi.mock("~/env", () => ({
	env: { NEXT_PUBLIC_EGAPRO_ENV: "dev", NEXT_PUBLIC_DEV_FILL_ENABLED: true },
}));

describe("DevFillButton", () => {
	afterEach(() => {
		Object.assign(env, {
			NEXT_PUBLIC_EGAPRO_ENV: "dev",
			NEXT_PUBLIC_DEV_FILL_ENABLED: true,
		});
	});

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

	it("renders nothing when env is not dev", () => {
		Object.assign(env, { NEXT_PUBLIC_EGAPRO_ENV: "preprod" });

		const { container } = render(<DevFillButton onFill={vi.fn()} />);
		expect(container.innerHTML).toBe("");
	});

	it("renders nothing when the dev fill flag is disabled", () => {
		Object.assign(env, { NEXT_PUBLIC_DEV_FILL_ENABLED: false });

		const { container } = render(<DevFillButton onFill={vi.fn()} />);
		expect(container.innerHTML).toBe("");
	});
});

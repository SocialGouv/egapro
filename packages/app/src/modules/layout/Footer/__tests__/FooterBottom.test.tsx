import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// `src/test/setup.ts` does not mock `~/env`, so each test defines its own.
async function withEnv(env: Record<string, string | undefined>) {
	vi.resetModules();
	vi.doMock("~/env", () => ({ env }));
	const mod = await import("../FooterBottom");
	return mod.FooterBottom;
}

function bottomListLabels() {
	return Array.from(
		screen.getByRole("list").children,
		(item) => item.textContent ?? "",
	);
}

afterEach(() => {
	vi.doUnmock("~/env");
	vi.resetModules();
	cleanup();
});

describe("FooterBottom", () => {
	it("shows the version right after the display settings, at the end of the list", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "v4.0.0-alpha.1",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(<Comp />);

		const labels = bottomListLabels();
		const settingsIndex = labels.findIndex((label) =>
			label.includes("Paramètres"),
		);
		const versionIndex = labels.findIndex((label) =>
			label.includes("Version v4.0.0-alpha.1"),
		);

		expect(settingsIndex).toBeGreaterThanOrEqual(0);
		expect(versionIndex).toBe(settingsIndex + 1);
		expect(versionIndex).toBe(labels.length - 1);
	});

	it("keeps the version out of the licence block", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "v4.0.0-alpha.1",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		const { container } = render(<Comp />);

		const copy = container.querySelector(".fr-footer__bottom-copy");
		expect(copy).not.toBeNull();
		expect(copy?.textContent).not.toContain("Version");
	});

	it("renders the list without a version item in local dev", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: undefined,
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(<Comp />);

		const labels = bottomListLabels();
		expect(labels.some((label) => label.includes("Version"))).toBe(false);
		expect(labels.at(-1)).toContain("Paramètres");
	});
});

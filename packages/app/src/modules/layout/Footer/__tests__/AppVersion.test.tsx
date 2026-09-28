import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// `env` is mocked per-test below. Each test redefines the module mock to set
// the public env vars the component reads.
async function withEnv(env: Record<string, string | undefined>) {
	vi.resetModules();
	vi.doMock("~/env", () => ({ env }));
	const mod = await import("../AppVersion");
	return mod.AppVersion;
}

afterEach(() => {
	vi.doUnmock("~/env");
	vi.resetModules();
	cleanup();
});

describe("AppVersion", () => {
	it("renders nothing when no version is set (local dev)", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: undefined,
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		const { container } = render(<Comp />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders as a list item so it can sit in the footer bottom link list", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "v4.0.0-alpha.1",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(
			<ul>
				<Comp />
			</ul>,
		);
		expect(screen.getByRole("listitem")).toContainElement(
			screen.getByRole("link"),
		);
	});

	it("names the destination in the accessible name, not only in a title", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "v4.0.0-alpha.1",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(
			<ul>
				<Comp />
			</ul>,
		);
		const link = screen.getByRole("link", {
			name: /^Version v4\.0\.0-alpha\.1.*code source sur GitHub/,
		});
		expect(link).not.toHaveAttribute("title");
	});

	it("links to the release page for a git tag (production)", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "v3.14.0-alpha.11",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(<Comp />);
		const link = screen.getByRole("link", {
			name: /v3\.14\.0-alpha\.11.*nouvelle fenêtre/,
		});
		expect(link).toHaveAttribute(
			"href",
			"https://github.com/SocialGouv/egapro/releases/tag/v3.14.0-alpha.11",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("links to the PR on a review app when the PR number is resolved", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "ticket/4020-version-footer",
			NEXT_PUBLIC_PR_NUMBER: "4039",
		});
		render(<Comp />);
		expect(
			screen.getByRole("link", {
				name: /ticket\/4020-version-footer.*nouvelle fenêtre/,
			}),
		).toHaveAttribute("href", "https://github.com/SocialGouv/egapro/pull/4039");
	});

	it("falls back to a branch-scoped PR search when no PR is open yet", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "ticket/4020-version-footer",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(<Comp />);
		const link = screen.getByRole("link");
		const href = link.getAttribute("href");
		expect(href).toContain("/pulls?q=");
		expect(href).toContain(
			encodeURIComponent("is:pr head:ticket/4020-version-footer"),
		);
	});

	it("links to the branch tree for a long-lived environment branch (preprod)", async () => {
		const Comp = await withEnv({
			NEXT_PUBLIC_APP_VERSION: "beta",
			NEXT_PUBLIC_PR_NUMBER: undefined,
		});
		render(<Comp />);
		expect(
			screen.getByRole("link", { name: /beta.*nouvelle fenêtre/ }),
		).toHaveAttribute("href", "https://github.com/SocialGouv/egapro/tree/beta");
	});
});

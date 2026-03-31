import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let onLoadCallbacks: Array<() => void> = [];

vi.mock("next/script", () => ({
	default: ({
		src,
		onLoad,
	}: {
		src: string;
		onLoad?: () => void;
		strategy?: string;
	}) => {
		if (onLoad) onLoadCallbacks.push(onLoad);
		return <script data-src={src} data-testid="next-script" />;
	},
}));

describe("SwaggerUI", () => {
	beforeEach(() => {
		onLoadCallbacks = [];
		vi.resetModules();
	});

	it("should render the swagger-ui container and load local assets", async () => {
		const { SwaggerUI } = await import("../SwaggerUI");
		const { container } = render(<SwaggerUI />);

		expect(document.getElementById("swagger-ui")).toBeInTheDocument();

		const link = container.querySelector(
			'link[href="/swagger-ui/swagger-ui.css"]',
		);
		expect(link).toBeInTheDocument();

		const scripts = container.querySelectorAll("[data-testid='next-script']");
		const srcs = Array.from(scripts).map((s) => s.getAttribute("data-src"));
		expect(srcs).toContain("/swagger-ui/swagger-ui-bundle.js");
		expect(srcs).toContain("/swagger-ui/swagger-ui-standalone-preset.js");
	});

	it("should initialize SwaggerUIBundle when scripts are loaded", async () => {
		const mockBundle = Object.assign(vi.fn(), {
			presets: { apis: "apis-preset" },
		});
		window.SwaggerUIBundle = mockBundle;
		window.SwaggerUIStandalonePreset = "standalone-preset";

		const { SwaggerUI } = await import("../SwaggerUI");
		render(<SwaggerUI />);

		for (const cb of onLoadCallbacks) cb();

		expect(mockBundle).toHaveBeenCalledWith(
			expect.objectContaining({
				url: "/api/v1/openapi.json",
				dom_id: "#swagger-ui",
				deepLinking: true,
			}),
		);
	});

	it("should not initialize twice on multiple onLoad calls", async () => {
		const mockBundle = Object.assign(vi.fn(), {
			presets: { apis: "apis-preset" },
		});
		window.SwaggerUIBundle = mockBundle;
		window.SwaggerUIStandalonePreset = "standalone-preset";

		const { SwaggerUI } = await import("../SwaggerUI");
		render(<SwaggerUI />);

		for (const cb of onLoadCallbacks) cb();
		for (const cb of onLoadCallbacks) cb();

		expect(mockBundle).toHaveBeenCalledTimes(1);
	});
});

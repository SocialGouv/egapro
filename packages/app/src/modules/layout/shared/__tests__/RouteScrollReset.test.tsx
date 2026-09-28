import { render } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteScrollReset } from "../RouteScrollReset";

let scrollToSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	scrollToSpy = vi
		.spyOn(window, "scrollTo")
		.mockImplementation(() => undefined);
	window.location.hash = "";
	document.body.innerHTML = '<main id="content" tabindex="-1"></main>';
});

afterEach(() => {
	scrollToSpy.mockRestore();
	document.body.innerHTML = "";
});

describe("RouteScrollReset", () => {
	it("does not scroll or move focus on the first render", () => {
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/4");

		render(<RouteScrollReset />);

		expect(scrollToSpy).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(document.body);
	});

	it("scrolls to the top and focuses #content when the pathname changes", () => {
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/4");
		const { rerender } = render(<RouteScrollReset />);

		vi.mocked(usePathname).mockReturnValue("/declaration/etape/5");
		rerender(<RouteScrollReset />);

		expect(scrollToSpy).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: "instant",
		});
		expect(document.activeElement).toBe(document.getElementById("content"));
	});

	it("stays idle when the pathname is unchanged between renders", () => {
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/4");
		const { rerender } = render(<RouteScrollReset />);

		rerender(<RouteScrollReset />);

		expect(scrollToSpy).not.toHaveBeenCalled();
	});

	it("does not scroll when the URL carries a hash anchor", () => {
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/4");
		const { rerender } = render(<RouteScrollReset />);

		window.location.hash = "#content";
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/5");
		rerender(<RouteScrollReset />);

		expect(scrollToSpy).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(document.body);
	});

	it("renders nothing", () => {
		vi.mocked(usePathname).mockReturnValue("/declaration/etape/4");

		const { container } = render(<RouteScrollReset />);

		expect(container).toBeEmptyDOMElement();
	});
});

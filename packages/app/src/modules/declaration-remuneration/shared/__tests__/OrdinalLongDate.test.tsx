import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrdinalLongDate } from "../OrdinalLongDate";

describe("OrdinalLongDate", () => {
	it("uses the 'er' suffix for the first of the month", () => {
		const { container } = render(
			<OrdinalLongDate date={new Date("2026-03-01T00:00:00Z")} />,
		);

		expect(container.querySelector("sup")?.textContent).toBe("er");
		expect(container.textContent).toBe("1er mars 2026");
	});

	it.each([
		["2026-09-15T00:00:00Z", "15 septembre 2026"],
		["2027-02-28T00:00:00Z", "28 février 2027"],
	])("renders any other day %s as a plain cardinal number", (iso, expected) => {
		const { container } = render(<OrdinalLongDate date={new Date(iso)} />);

		expect(container.querySelector("sup")).toBeNull();
		expect(container.textContent).toBe(expected);
	});

	it("reads the day in UTC, not the local timezone", () => {
		// Just before midnight UTC: a local-time reading could roll to the next
		// day and flip the ordinal — the formatter must stay on the UTC date.
		const { container } = render(
			<OrdinalLongDate date={new Date("2026-03-01T23:59:00Z")} />,
		);

		expect(container.textContent).toBe("1er mars 2026");
	});
});

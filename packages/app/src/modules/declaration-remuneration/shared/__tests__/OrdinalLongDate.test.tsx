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

	it("uses the 'e' suffix for any other day", () => {
		const { container } = render(
			<OrdinalLongDate date={new Date("2026-09-15T00:00:00Z")} />,
		);

		expect(container.querySelector("sup")?.textContent).toBe("e");
		expect(container.textContent).toBe("15e septembre 2026");
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

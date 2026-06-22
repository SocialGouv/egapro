import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import { HomeSearchForm } from "../HomeSearchForm";

beforeEach(() => {
	trackEventMock.mockReset();
});

describe("HomeSearchForm tracking", () => {
	it("emits a SEARCH_SUBMIT event naming only the facets used", () => {
		render(<HomeSearchForm />);

		fireEvent.change(screen.getByLabelText(/Numéro Siren/i), {
			target: { value: "Some Company" },
		});
		fireEvent.change(screen.getByLabelText("Région"), {
			target: { value: "11" },
		});
		fireEvent.submit(screen.getByRole("form"));

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: "query+region",
		});
	});

	it("never leaks the raw search query (no PII in the payload)", () => {
		render(<HomeSearchForm />);

		fireEvent.change(screen.getByLabelText(/Numéro Siren/i), {
			target: { value: "552100554 Acme" },
		});
		fireEvent.submit(screen.getByRole("form"));

		const payload = JSON.stringify(trackEventMock.mock.calls[0]?.[0]);
		expect(payload).not.toContain("552100554");
		expect(payload).not.toContain("Acme");
	});

	it("reports 'empty' when no facet is filled", () => {
		render(<HomeSearchForm />);

		fireEvent.submit(screen.getByRole("form"));

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.SEARCH,
			action: MATOMO_ACTION.SEARCH_SUBMIT,
			name: "empty",
		});
	});
});

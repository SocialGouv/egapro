import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock, generateTemplateMock, startTimerMock } = vi.hoisted(
	() => ({
		trackEventMock: vi.fn(),
		generateTemplateMock: vi.fn(),
		startTimerMock: vi.fn(),
	}),
);

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});
vi.mock("../categoryFileHandler", () => ({
	generateTemplate: generateTemplateMock,
}));
vi.mock("../categoryModelTracking", () => ({
	startCategoryModelTimer: startTimerMock,
}));

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import { CategoryTemplateDownload } from "../CategoryTemplateDownload";

beforeEach(() => {
	trackEventMock.mockReset();
	startTimerMock.mockReset();
	generateTemplateMock.mockReset();
	generateTemplateMock.mockResolvedValue(new Blob(["data"]));
	URL.createObjectURL = vi.fn(() => "blob:mock");
	URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("CategoryTemplateDownload", () => {
	it.each([
		["xlsx", "Télécharger le modèle (.xlsx)"],
		["csv", "Télécharger le modèle (.csv)"],
	] as const)("downloads the %s template, starts the timer and emits category_template_download with that format", async (format, label) => {
		render(<CategoryTemplateDownload categories={[]} />);

		fireEvent.click(screen.getByRole("button", { name: label }));

		await waitFor(() => expect(trackEventMock).toHaveBeenCalled());

		expect(startTimerMock).toHaveBeenCalledTimes(1);
		expect(generateTemplateMock).toHaveBeenCalledWith([], format);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_TEMPLATE_DOWNLOAD,
			name: format,
		});
	});

	it("emits one template-download event per format across both buttons", async () => {
		render(<CategoryTemplateDownload categories={[]} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Télécharger le modèle (.xlsx)" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Télécharger le modèle (.csv)" }),
		);

		await waitFor(() => expect(trackEventMock).toHaveBeenCalledTimes(2));

		const names = trackEventMock.mock.calls.map((call) => call[0].name);
		expect(names).toEqual(["xlsx", "csv"]);
	});

	it("shows an error message and emits no event when template generation fails", async () => {
		generateTemplateMock.mockRejectedValue(new Error("boom"));
		render(<CategoryTemplateDownload categories={[]} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Télécharger le modèle (.xlsx)" }),
		);

		expect(
			await screen.findByText(/Le téléchargement du modèle a échoué/i),
		).toBeInTheDocument();
		expect(trackEventMock).not.toHaveBeenCalled();
	});

	it("disables both buttons when disabled", () => {
		render(<CategoryTemplateDownload categories={[]} disabled />);

		for (const button of screen.getAllByRole("button")) {
			expect(button).toBeDisabled();
		}
	});
});

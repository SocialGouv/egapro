import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportError, ImportResult } from "../categoryFileHandler";
import type { EmployeeCategory } from "../categorySerializer";

const {
	trackEventMock,
	parseImportFileMock,
	startTimerMock,
	trackDurationMock,
	concealMock,
	getDsfrModalMock,
} = vi.hoisted(() => {
	const conceal = vi.fn();
	return {
		trackEventMock: vi.fn(),
		parseImportFileMock: vi.fn(),
		startTimerMock: vi.fn(),
		trackDurationMock: vi.fn(),
		concealMock: conceal,
		getDsfrModalMock: vi.fn(() => ({ conceal })),
	};
});

vi.mock("~/modules/analytics", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/analytics")>();
	return { ...actual, trackEvent: trackEventMock };
});
vi.mock("~/modules/shared", () => ({ getDsfrModal: getDsfrModalMock }));
vi.mock("../categoryFileHandler", () => ({
	parseImportFile: parseImportFileMock,
}));
vi.mock("../categoryModelTracking", () => ({
	startCategoryModelTimer: startTimerMock,
	trackCategoryImportDuration: trackDurationMock,
}));

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "~/modules/analytics";
import { CategoryImportExport } from "../CategoryImportExport";

function category(id: number, name: string): EmployeeCategory {
	return {
		id,
		name,
		womenCount: "",
		menCount: "",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
	};
}

function uploadFile(): void {
	const input = screen.getByLabelText(/Sélectionner un fichier/i);
	fireEvent.change(input, {
		target: { files: [new File(["x"], "import.csv", { type: "text/csv" })] },
	});
}

beforeEach(() => {
	trackEventMock.mockReset();
	parseImportFileMock.mockReset();
	startTimerMock.mockReset();
	trackDurationMock.mockReset();
	concealMock.mockReset();
	getDsfrModalMock.mockReset();
	getDsfrModalMock.mockReturnValue({ conceal: concealMock });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("CategoryImportExport import button", () => {
	it("starts the model timer when the import modal trigger is clicked", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Importer les données" }),
		);

		expect(startTimerMock).toHaveBeenCalledTimes(1);
	});
});

describe("CategoryImportExport successful import", () => {
	it("imports categories, emits category_import then the import duration", async () => {
		const onImport = vi.fn();
		const categories = [category(0, "Cadres"), category(1, "Ouvriers")];
		parseImportFileMock.mockResolvedValue({
			ok: true,
			categories,
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={onImport} />);
		uploadFile();

		await waitFor(() => expect(onImport).toHaveBeenCalledWith(categories));

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_IMPORT,
			value: categories.length,
		});
		expect(trackDurationMock).toHaveBeenCalledTimes(1);
		expect(concealMock).toHaveBeenCalledTimes(1);
	});

	it("does nothing when the file picker is dismissed without a file", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		fireEvent.change(screen.getByLabelText(/Sélectionner un fichier/i), {
			target: { files: [] },
		});

		expect(parseImportFileMock).not.toHaveBeenCalled();
		expect(trackEventMock).not.toHaveBeenCalled();
	});
});

describe("CategoryImportExport failed import", () => {
	it.each([
		"missing-columns",
		"invalid-value",
		"empty-file",
	] as ImportError["type"][])("emits category_import_failure with the %s enum type and never the message", async (type) => {
		const message = "Détail technique sensible 552100554";
		parseImportFileMock.mockResolvedValue({
			ok: false,
			errors: [{ type, message }],
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={vi.fn()} />);
		uploadFile();

		await waitFor(() => expect(trackEventMock).toHaveBeenCalled());

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_IMPORT_FAILURE,
			name: type,
		});
		const payload = JSON.stringify(trackEventMock.mock.calls[0]?.[0]);
		expect(payload).not.toContain(message);
		expect(payload).not.toContain("552100554");
		expect(trackDurationMock).not.toHaveBeenCalled();
	});
});

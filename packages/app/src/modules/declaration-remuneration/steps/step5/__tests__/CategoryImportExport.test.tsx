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

// Stub only getDsfrModal; DSFR JS that drives the panel is absent in jsdom.
vi.mock("~/modules/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/modules/shared")>();
	return { ...actual, getDsfrModal: getDsfrModalMock };
});

vi.mock("../categoryFileHandler", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../categoryFileHandler")>();
	return { ...actual, parseImportFile: parseImportFileMock };
});

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

const trigger = () =>
	screen.getByRole("button", { name: "Importer les données" });
const fileInput = () => screen.getByLabelText("Sélectionner des fichiers");
const importButton = () =>
	screen.getByRole("button", { name: "Importer", hidden: true });
const templateCard = () =>
	screen.getByRole("button", {
		name: "Fichier d'import à remplir",
		hidden: true,
	});

function selectFile(
	file = new File(["x"], "import.csv", { type: "text/csv" }),
): void {
	fireEvent.change(fileInput(), { target: { files: [file] } });
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

describe("CategoryImportExport trigger button", () => {
	it("starts the model timer when the import panel trigger is clicked", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		fireEvent.click(trigger());

		expect(startTimerMock).toHaveBeenCalledTimes(1);
	});

	it("uses the file-download icon on the import trigger", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		expect(trigger()).toHaveClass("fr-icon-file-download-line");
		expect(trigger()).not.toHaveClass("fr-icon-upload-line");
	});

	it("disables the trigger when the disabled prop is set", () => {
		render(<CategoryImportExport disabled onImport={vi.fn()} />);

		expect(trigger()).toBeDisabled();
	});
});

describe("CategoryImportExport panel contents", () => {
	it("renders the dropzone, template card, help link and a disabled Importer button", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		expect(fileInput()).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /Sélectionner un fichier/,
				hidden: true,
			}),
		).toBeInTheDocument();
		expect(templateCard()).toBeInTheDocument();

		const helpLink = screen.getByRole("link", {
			name: /Centre d'aide/,
			hidden: true,
		});
		expect(helpLink).toHaveAttribute("href", "/aide");

		expect(importButton()).toBeDisabled();
	});

	it("renders the guide card and the resources link as disabled placeholders", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		expect(
			screen.getByRole("button", {
				name: "Guide de remplissage",
				hidden: true,
			}),
		).toBeDisabled();
		expect(
			screen.getByRole("button", {
				name: "Ressources et modèles de fichiers",
				hidden: true,
			}),
		).toBeDisabled();
	});

	it("mentions the filling guide in the instruction text", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		expect(
			screen.getByText(/en vous aidant si besoin du guide de remplissage/),
		).toBeInTheDocument();
	});
});

describe("CategoryImportExport template download", () => {
	it("downloads modele-indicateur-g.csv and emits category_template_download", () => {
		const downloadNames: string[] = [];
		const clickSpy = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(function mockClick(this: HTMLAnchorElement) {
				downloadNames.push(this.download);
			});

		render(<CategoryImportExport onImport={vi.fn()} />);
		fireEvent.click(templateCard());

		expect(downloadNames).toEqual(["modele-indicateur-g.csv"]);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_TEMPLATE_DOWNLOAD,
			name: "csv",
		});
		expect(startTimerMock).toHaveBeenCalledTimes(1);

		clickSpy.mockRestore();
	});
});

describe("CategoryImportExport file selection and import", () => {
	it("enables the Importer button only once a file is selected", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		expect(importButton()).toBeDisabled();

		selectFile();

		expect(importButton()).toBeEnabled();
	});

	it("imports categories on explicit click, emits category_import then the duration, and closes the panel", async () => {
		const onImport = vi.fn();
		const categories = [category(0, "Cadres"), category(1, "Ouvriers")];
		parseImportFileMock.mockResolvedValue({
			ok: true,
			categories,
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={onImport} />);
		selectFile();
		fireEvent.click(importButton());

		await waitFor(() => expect(onImport).toHaveBeenCalledWith(categories));

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_IMPORT,
			value: categories.length,
		});
		expect(trackDurationMock).toHaveBeenCalledTimes(1);
		expect(concealMock).toHaveBeenCalledTimes(1);
	});

	it("does not parse and keeps the button disabled when the picker is dismissed with no file", () => {
		render(<CategoryImportExport onImport={vi.fn()} />);

		fireEvent.change(fileInput(), { target: { files: [] } });

		expect(parseImportFileMock).not.toHaveBeenCalled();
		expect(importButton()).toBeDisabled();
	});
});

describe("CategoryImportExport failed import", () => {
	it.each([
		"missing-columns",
		"invalid-value",
		"empty-file",
	] as ImportError["type"][])("shows the %s error in the panel and emits category_import_failure without leaking the message", async (type) => {
		const message = "Détail technique sensible 552100554";
		parseImportFileMock.mockResolvedValue({
			ok: false,
			errors: [{ type, message }],
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={vi.fn()} />);
		selectFile();
		fireEvent.click(importButton());

		await waitFor(() => expect(trackEventMock).toHaveBeenCalled());

		expect(screen.getByText(message)).toBeInTheDocument();
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_IMPORT_FAILURE,
			name: type,
		});

		const payload = JSON.stringify(trackEventMock.mock.calls[0]?.[0]);
		expect(payload).not.toContain(message);
		expect(payload).not.toContain("552100554");

		expect(trackDurationMock).not.toHaveBeenCalled();
		expect(concealMock).not.toHaveBeenCalled();
	});

	it("clears stale errors and the selected file when the panel is reopened", async () => {
		const message = "Le fichier ne contient aucune donnée exploitable.";
		parseImportFileMock.mockResolvedValue({
			ok: false,
			errors: [{ type: "empty-file", message }],
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={vi.fn()} />);
		selectFile();
		fireEvent.click(importButton());

		await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
		expect(importButton()).toBeEnabled();

		fireEvent.click(trigger());

		expect(screen.queryByText(message)).not.toBeInTheDocument();
		expect(importButton()).toBeDisabled();
	});

	it("clears stale errors when a new file is selected", async () => {
		const message = "Le fichier ne contient aucune donnée exploitable.";
		parseImportFileMock.mockResolvedValue({
			ok: false,
			errors: [{ type: "empty-file", message }],
		} satisfies ImportResult);

		render(<CategoryImportExport onImport={vi.fn()} />);
		selectFile();
		fireEvent.click(importButton());

		await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());

		selectFile(new File(["y"], "retry.csv", { type: "text/csv" }));

		expect(screen.queryByText(message)).not.toBeInTheDocument();
	});
});

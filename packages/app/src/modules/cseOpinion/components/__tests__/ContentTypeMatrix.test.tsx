import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
	buildColumnId,
	computeContentTypeColumns,
} from "~/modules/cseOpinion/contentTypeColumns";
import type { AssociationMap, UploadedFile } from "~/modules/cseOpinion/types";
import { ContentTypeMatrix } from "../ContentTypeMatrix";

const COLUMNS = computeContentTypeColumns({
	hasSecondDeclaration: true,
	firstDeclGapConsulted: true,
	secondDeclGapConsulted: true,
	firstDeclGapHigh: true,
	secondDeclGapHigh: true,
});

const SINGLE_FILE: UploadedFile = {
	id: "file-1",
	fileName: "avis-1.pdf",
	uploadedAt: new Date("2026-03-15"),
	fileSize: 63365,
};

const FILES: UploadedFile[] = [
	SINGLE_FILE,
	{
		id: "file-2",
		fileName: "avis-2.pdf",
		uploadedAt: new Date("2026-03-16"),
		fileSize: null,
	},
];

function emptyMap(): AssociationMap {
	return COLUMNS.reduce<AssociationMap>((map, column) => {
		map[column.id] = null;
		return map;
	}, {});
}

function renderMatrix(
	overrides: Partial<React.ComponentProps<typeof ContentTypeMatrix>> = {},
) {
	const props = {
		files: FILES,
		columns: COLUMNS,
		associations: emptyMap(),
		onToggle: vi.fn(),
		onDelete: vi.fn(),
		deletingFileId: null,
		...overrides,
	};
	return { ...render(<ContentTypeMatrix {...props} />), props };
}

describe("ContentTypeMatrix", () => {
	it("renders one row per file with a view link pointing to the file endpoint", () => {
		renderMatrix();

		const viewLinks = screen.getAllByRole("link", { name: /avis-1\.pdf/ });
		expect(viewLinks[0]).toHaveAttribute("href", "/api/v1/files/file-1");
		expect(viewLinks[0]).toHaveAttribute("target", "_blank");
		expect(screen.getByRole("link", { name: /avis-2\.pdf/ })).toHaveAttribute(
			"href",
			"/api/v1/files/file-2",
		);
	});

	it("shows the file type and size, falling back to the type alone when size is unknown", () => {
		renderMatrix();

		expect(screen.getByText("PDF – 61,88 Ko")).toBeInTheDocument();
		expect(screen.getByText("PDF")).toBeInTheDocument();
	});

	it("renders one checkbox per file and column combination", () => {
		renderMatrix();

		expect(screen.getAllByRole("checkbox")).toHaveLength(
			FILES.length * COLUMNS.length,
		);
	});

	it("keeps each checkbox label visible so the DSFR box renders (regression guard for epic-3476)", () => {
		renderMatrix();

		// DSFR paints the visible checkbox via the label::before pseudo-element
		// (the native input is opacity:0). If the label itself carries fr-sr-only
		// it is clipped to 1px and the box disappears — the original epic-3476 bug,
		// invisible to jsdom and to Playwright (which ignores opacity). Guard it:
		// the label must stay un-clipped and carry the accessible name in a nested
		// sr-only span instead.
		for (const checkbox of screen.getAllByRole("checkbox")) {
			const label = checkbox
				.closest(".fr-checkbox-group")
				?.querySelector("label");
			expect(label).not.toBeNull();
			expect(label).not.toHaveClass("fr-sr-only");
			expect(label?.querySelector(".fr-sr-only")).not.toBeNull();
		}
	});

	it("checks only the checkbox of the column associated to a file", () => {
		const associations = emptyMap();
		associations[buildColumnId(1, "accuracy")] = "file-1";

		renderMatrix({ associations });

		expect(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-1.pdf",
			}),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-2.pdf",
			}),
		).not.toBeChecked();
	});

	it("disables the same column for other files once it is taken (column exclusivity, S5)", () => {
		const associations = emptyMap();
		associations[buildColumnId(1, "accuracy")] = "file-1";

		renderMatrix({ associations });

		expect(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-1.pdf",
			}),
		).toBeEnabled();
		expect(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-2.pdf",
			}),
		).toBeDisabled();
	});

	it("calls onToggle with the column id, file id and the new checked state", async () => {
		const user = userEvent.setup();
		const { props } = renderMatrix();

		await user.click(
			screen.getByRole("checkbox", {
				name: "Justification — 2e déclaration — avis-2.pdf",
			}),
		);

		expect(props.onToggle).toHaveBeenCalledWith(
			buildColumnId(2, "gap"),
			"file-2",
			true,
		);
	});

	it("reports unchecking with checked=false so the column frees up (S6)", async () => {
		const user = userEvent.setup();
		const associations = emptyMap();
		associations[buildColumnId(1, "accuracy")] = "file-1";
		const { props } = renderMatrix({ associations });

		await user.click(
			screen.getByRole("checkbox", {
				name: "Exactitude — 1re déclaration — avis-1.pdf",
			}),
		);

		expect(props.onToggle).toHaveBeenCalledWith(
			buildColumnId(1, "accuracy"),
			"file-1",
			false,
		);
	});

	it("calls onDelete with the file id when its delete button is clicked", async () => {
		const user = userEvent.setup();
		const { props } = renderMatrix({ files: [SINGLE_FILE] });

		await user.click(screen.getByRole("button", { name: /Supprimer/ }));

		expect(props.onDelete).toHaveBeenCalledWith("file-1");
	});

	it("shows the deleting state and disables only the deleting file's button", () => {
		renderMatrix({ deletingFileId: "file-1" });

		expect(
			screen.getByRole("button", { name: /Suppression de avis-1\.pdf/ }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Supprimer avis-2.pdf" }),
		).toBeEnabled();
	});

	it("disables every interactive control when the matrix is globally disabled", () => {
		renderMatrix({ disabled: true });

		for (const checkbox of screen.getAllByRole("checkbox")) {
			expect(checkbox).toBeDisabled();
		}
		for (const button of screen.getAllByRole("button", { name: /Supprimer/ })) {
			expect(button).toBeDisabled();
		}
	});

	it("omits the declaration sub-label when there is a single declaration", () => {
		const singleColumns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: true,
			secondDeclGapHigh: false,
		});
		const associations = singleColumns.reduce<AssociationMap>((map, column) => {
			map[column.id] = null;
			return map;
		}, {});

		render(
			<ContentTypeMatrix
				associations={associations}
				columns={singleColumns}
				deletingFileId={null}
				files={[SINGLE_FILE]}
				onDelete={vi.fn()}
				onToggle={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("checkbox", { name: "Exactitude — avis-1.pdf" }),
		).toBeInTheDocument();
		expect(screen.queryByText("1re déclaration")).not.toBeInTheDocument();
	});
});

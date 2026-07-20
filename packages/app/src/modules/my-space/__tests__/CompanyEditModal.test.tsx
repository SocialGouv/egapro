import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIP_WORKFORCE_UNKNOWN_LABEL } from "~/modules/domain";

const mockMutate = vi.fn();

vi.mock("~/modules/analytics", () => ({
	campaignYearDimension: () => ({ 1: "2026" }),
	MATOMO_ACTION: { CSE_STATUS_CONFIRM: "cse_status_confirm" },
	MATOMO_EVENT_CATEGORY: { CSE_STATUS: "cse_status" },
	trackEvent: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockImplementation(({ onSuccess }) => ({
					mutate: (variables: { siren: string; hasCse: boolean }) => {
						mockMutate(variables);
						// Mirror the real tRPC contract: onSuccess(data, variables).
						onSuccess(undefined, variables);
					},
					isPending: false,
				})),
			},
		},
	},
}));

import { CompanyEditModal } from "../CompanyEditModal";

const company = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: "12 rue des Innovateurs, 75011 Paris",
	nafCode: "6202A",
	gipWorkforce: 2256,
	hasCse: null as boolean | null,
};

beforeEach(() => {
	mockMutate.mockClear();
});

// The <dialog> is closed (not open) in jsdom, so its content is hidden.
// We use { hidden: true } for role queries to access hidden elements.
describe("CompanyEditModal", () => {
	it("disables browser autofill on the form", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.querySelector("form")).toHaveAttribute(
			"autocomplete",
			"off",
		);
	});

	it("marks the dialog as modal for assistive technologies", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.querySelector("dialog")).toHaveAttribute(
			"aria-modal",
			"true",
		);
	});

	it("structures readonly company data as description lists", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		const terms = Array.from(container.querySelectorAll("dl dt")).map(
			(dt) => dt.textContent,
		);
		expect(terms).toContain("Raison sociale :");
		expect(terms).toContain("SIREN :");
		expect(terms).toContain("Adresse :");
		expect(terms).toContain("Code NAF :");
	});

	it("renders the modal with company info", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(
			screen.getByRole("heading", {
				name: "Modifier les informations",
				hidden: true,
			}),
		).toBeInTheDocument();
		expect(container.textContent).toContain("Alpha Solutions");
		expect(container.textContent).toContain("532 847 196");
		expect(container.textContent).toContain(
			"12 rue des Innovateurs, 75011 Paris",
		);
		expect(container.textContent).toContain("6202A");
	});

	it("renders formatted workforce", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toMatch(/2 256/);
	});

	it("floors the workforce display so 99.97 shows as 99", () => {
		const { container } = render(
			<CompanyEditModal company={{ ...company, gipWorkforce: 99.97 }} />,
		);

		expect(container.textContent).toContain("99");
		expect(container.textContent).not.toContain("100");
	});

	it("shows the GIP unknown label when gipWorkforce is null", () => {
		const { container } = render(
			<CompanyEditModal company={{ ...company, gipWorkforce: null }} />,
		);

		expect(container.textContent).toContain(GIP_WORKFORCE_UNKNOWN_LABEL);
	});

	it("disables submit when no CSE is selected", () => {
		render(<CompanyEditModal company={company} />);

		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).toBeDisabled();
	});

	it("enables submit after selecting a CSE option", () => {
		render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Oui", { exact: true }));

		expect(
			screen.getByRole("button", { name: "Enregistrer", hidden: true }),
		).not.toBeDisabled();
	});

	it("pre-selects CSE radio when hasCse is already set", () => {
		render(<CompanyEditModal company={{ ...company, hasCse: true }} />);

		expect(screen.getByLabelText("Oui", { exact: true })).toBeChecked();
		expect(screen.getByLabelText("Non", { exact: true })).not.toBeChecked();
	});

	it("calls mutation with correct data on submit", async () => {
		render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Non", { exact: true }));

		const form = document.getElementById("company-edit-form");
		expect(form).toBeTruthy();
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({
				siren: "532847196",
				hasCse: false,
			});
		});
	});

	it("renders source texts", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Source : INSEE");
		expect(container.textContent).toContain(
			"Source : GIP-MDS (DSN — Déclarations sociales nominatives).",
		);
		expect(container.textContent).toContain("élections professionnelles");
	});

	it("renders CSE fieldset with legend", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Existence d'un CSE (obligatoire)");
		expect(screen.getByLabelText("Oui", { exact: true })).toBeInTheDocument();
		expect(screen.getByLabelText("Non", { exact: true })).toBeInTheDocument();
	});

	describe("when the CSE is not applicable (gipWorkforce below 100 or unknown)", () => {
		it("hides the CSE fieldset and the Enregistrer button, and shows a Fermer button", () => {
			const { container } = render(
				<CompanyEditModal company={{ ...company, gipWorkforce: 45 }} />,
			);

			expect(screen.queryByLabelText("Oui", { exact: true })).toBeNull();
			expect(screen.queryByLabelText("Non", { exact: true })).toBeNull();
			expect(
				screen.queryByRole("button", { name: "Enregistrer", hidden: true }),
			).toBeNull();

			const footerButtons = container.querySelectorAll(
				".fr-modal__footer button",
			);
			expect(footerButtons).toHaveLength(1);
			expect(footerButtons[0]).toHaveTextContent("Fermer");
		});

		it("hides the CSE fieldset when the company is absent from the GIP file", () => {
			const { container } = render(
				<CompanyEditModal company={{ ...company, gipWorkforce: null }} />,
			);

			expect(screen.queryByLabelText("Oui", { exact: true })).toBeNull();
			expect(container.textContent).toContain(GIP_WORKFORCE_UNKNOWN_LABEL);
			expect(container.textContent).not.toContain(
				"Vérifier les données affichées et compléter",
			);
		});
	});
});

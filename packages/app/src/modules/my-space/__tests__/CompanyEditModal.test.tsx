import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	GIP_WORKFORCE_VOLUNTARY_DISPLAY,
	getWorkforceYear,
} from "~/modules/domain";

const mockMutateAsync = vi.fn();
let mockIsPending = false;

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
					// Mirror the real tRPC contract: mutateAsync resolves/rejects and
					// fires onSuccess(data, variables) on success.
					mutateAsync: async (variables: {
						siren: string;
						hasCse: boolean;
					}) => {
						const result = await mockMutateAsync(variables);
						onSuccess(result, variables);
						return result;
					},
					isPending: mockIsPending,
				})),
			},
		},
	},
}));

import { CompanyEditModal } from "../CompanyEditModal";
import styles from "../CompanyEditModal.module.scss";

const company = {
	siren: "532847196",
	name: "Alpha Solutions",
	address: "12 rue des Innovateurs, 75011 Paris",
	nafCode: "6202A",
	gipWorkforce: 2256,
	hasCse: null as boolean | null,
};

beforeEach(() => {
	mockMutateAsync.mockReset();
	mockMutateAsync.mockResolvedValue(undefined);
	mockIsPending = false;
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

		// formatCount uses a narrow no-break space (U+202F) as thousands separator.
		expect(container.textContent).toMatch(/2\u202f256/);
	});

	it("labels the workforce with the N-1 reference year, not the current campaign year", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain(
			`Effectif annuel moyen en ${getWorkforceYear()} :`,
		);
	});

	it("floors the workforce display so 99.97 shows as 99", () => {
		const { container } = render(
			<CompanyEditModal company={{ ...company, gipWorkforce: 99.97 }} />,
		);

		expect(container.textContent).toContain("99");
		expect(container.textContent).not.toContain("100");
	});

	it("shows the GIP unknown label instead of the exact headcount below the threshold", () => {
		// Issue 3914: the bracket was keyed on "absent from the GIP file", so a
		// company present with 37 employees rendered "37".
		const { container } = render(
			<CompanyEditModal company={{ ...company, gipWorkforce: 37 }} />,
		);

		expect(container.textContent).toContain(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
		expect(screen.queryByText("37")).not.toBeInTheDocument();
	});

	it("shows the GIP unknown label when gipWorkforce is null", () => {
		const { container } = render(
			<CompanyEditModal company={{ ...company, gipWorkforce: null }} />,
		);

		expect(container.textContent).toContain(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
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
			expect(mockMutateAsync).toHaveBeenCalledWith({
				siren: "532847196",
				hasCse: false,
			});
		});
	});

	it("does not fire the mutation when the form is submitted without a CSE selection", async () => {
		render(<CompanyEditModal company={company} />);

		// Bypass the disabled submit button to hit the guard directly.
		const form = document.getElementById("company-edit-form");
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(mockMutateAsync).not.toHaveBeenCalled();
		});
	});

	it("renders an em dash placeholder for a readonly field with no value", () => {
		render(<CompanyEditModal company={{ ...company, address: null }} />);

		const addressTerm = screen
			.getAllByRole("term", { hidden: true })
			.find((dt) => dt.textContent === "Adresse :");
		expect(addressTerm?.nextElementSibling).toHaveTextContent("—");
	});

	it("shows an error alert when the mutation rejects and keeps the modal state", async () => {
		mockMutateAsync.mockRejectedValue(new Error("network down"));
		render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Non", { exact: true }));

		const form = document.getElementById("company-edit-form");
		if (form) fireEvent.submit(form);

		const alert = await screen.findByRole("alert", { hidden: true });
		expect(alert).toHaveTextContent(
			"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
		);
		expect(alert.className).toContain("fr-alert--error");
		expect(form).toContainElement(alert);
	});

	it("clears the error alert on a subsequent successful submit", async () => {
		mockMutateAsync.mockRejectedValueOnce(new Error("network down"));
		render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Non", { exact: true }));
		const form = document.getElementById("company-edit-form");
		if (form) fireEvent.submit(form);

		await screen.findByRole("alert", { hidden: true });

		mockMutateAsync.mockResolvedValue(undefined);
		if (form) fireEvent.submit(form);

		await waitFor(() => {
			expect(
				screen.queryByRole("alert", { hidden: true }),
			).not.toBeInTheDocument();
		});
	});

	it("does not render an error alert before any submit", () => {
		render(<CompanyEditModal company={company} />);

		expect(
			screen.queryByRole("alert", { hidden: true }),
		).not.toBeInTheDocument();
	});

	it("shows a pending label on the submit button while the mutation is in flight", () => {
		mockIsPending = true;
		render(<CompanyEditModal company={company} />);

		const submit = screen.getByRole("button", {
			name: "Enregistrement…",
			hidden: true,
		});
		expect(submit).toBeInTheDocument();
		expect(submit).toBeDisabled();
	});

	it("resets the form fields and clears the error when the dialog reopens", async () => {
		mockMutateAsync.mockRejectedValue(new Error("network down"));
		const { container } = render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Oui", { exact: true }));
		const form = document.getElementById("company-edit-form");
		if (form) fireEvent.submit(form);
		await screen.findByRole("alert", { hidden: true });
		expect(screen.getByLabelText("Oui", { exact: true })).toBeChecked();

		// Re-opening the DSFR dialog toggles the `open` attribute, which the
		// component observes to reset the form to its initial props.
		const dialog = container.querySelector("dialog");
		if (dialog) {
			act(() => {
				dialog.setAttribute("open", "");
			});
		}

		await waitFor(() => {
			expect(screen.getByLabelText("Oui", { exact: true })).not.toBeChecked();
		});
		expect(
			screen.queryByRole("alert", { hidden: true }),
		).not.toBeInTheDocument();
	});

	it("renders source texts", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Source : INSEE");
		expect(container.textContent).toContain(
			"Source : DSN (Déclarations Sociales Nominatives).",
		);
		expect(container.textContent).toContain("élections professionnelles");
	});

	it("phrases the CSE intro without the 'manquantes' wording", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain(
			"compléter l'information sur l'existence d'un CSE",
		);
		expect(container.textContent).not.toContain("l'information manquantes");
	});

	it("points the contact link to the help page in a new tab", () => {
		render(<CompanyEditModal company={company} />);

		const contactLink = screen.getByRole("link", {
			name: /nous contacter\s*\(ouvre une nouvelle fenêtre\)/,
			hidden: true,
		});

		expect(contactLink).toHaveAttribute("href", "/aide/nous-contacter");
		expect(contactLink).toHaveAttribute("target", "_blank");
		expect(contactLink).toHaveAttribute("rel", "noopener noreferrer");
		expect(contactLink).toHaveClass(styles.contactLink ?? "");
	});

	it("renders CSE fieldset with legend", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Existence d'un CSE (obligatoire)");
		expect(screen.getByLabelText("Oui", { exact: true })).toBeInTheDocument();
		expect(screen.getByLabelText("Non", { exact: true })).toBeInTheDocument();
	});

	it("renders the obligatory mention as plain legend text so it inherits the label typography", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		const legend = container.querySelector("legend");
		expect(legend).toHaveTextContent("Existence d'un CSE (obligatoire)");
		expect(legend?.childElementCount).toBe(0);
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
			expect(container.textContent).toContain(GIP_WORKFORCE_VOLUNTARY_DISPLAY);
			expect(container.textContent).not.toContain(
				"Vérifier les données affichées et compléter",
			);
		});
	});
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		company: {
			updateHasCse: {
				useMutation: vi.fn().mockImplementation(({ onSuccess }) => ({
					mutate: (...args: unknown[]) => {
						mockMutate(...args);
						onSuccess();
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
	workforce: 2256,
	hasCse: null as boolean | null,
};

// The <dialog> is closed (not open) in jsdom, so its content is hidden.
// We use { hidden: true } for role queries to access hidden elements.
describe("CompanyEditModal", () => {
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

		expect(container.textContent).toMatch(/2\u202f256/);
	});

	it("shows dash when workforce is null", () => {
		const { container } = render(
			<CompanyEditModal company={{ ...company, workforce: null }} />,
		);

		const dialog = container.querySelector("dialog");
		const strongElements = dialog?.querySelectorAll("strong") ?? [];
		const effectifStrong = Array.from(strongElements).find(
			(el) => el.textContent === "—",
		);
		expect(effectifStrong).toBeTruthy();
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

	it("calls mutation with correct data on submit", () => {
		render(<CompanyEditModal company={company} />);

		fireEvent.click(screen.getByLabelText("Non", { exact: true }));

		const form = document.getElementById("company-edit-form");
		expect(form).toBeTruthy();
		fireEvent.submit(form!);

		expect(mockMutate).toHaveBeenCalledWith({
			siren: "532847196",
			hasCse: false,
		});
	});

	it("renders source texts", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Source : INSEE");
		expect(container.textContent).toContain(
			"déclarations sociales nominatives",
		);
		expect(container.textContent).toContain("élections professionnelles");
	});

	it("renders CSE fieldset with legend", () => {
		const { container } = render(<CompanyEditModal company={company} />);

		expect(container.textContent).toContain("Existence d'un CSE (obligatoire)");
		expect(screen.getByLabelText("Oui", { exact: true })).toBeInTheDocument();
		expect(screen.getByLabelText("Non", { exact: true })).toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MultiSelectField } from "~/modules/shared/MultiSelectField";

const OPTIONS = [
	{ value: "11", label: "Île-de-France" },
	{ value: "84", label: "Auvergne-Rhône-Alpes" },
	{ value: "53", label: "Bretagne" },
];

function renderField(selected: string[] = [], searchable = false) {
	return render(
		<form>
			<MultiSelectField
				id="facet-region"
				label="Région"
				name="region"
				options={OPTIONS}
				searchable={searchable}
				selected={selected}
			/>
		</form>,
	);
}

function submittedValues(container: HTMLElement, name: string): string[] {
	return Array.from(
		container.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`),
	)
		.filter((input) => input.type === "hidden" || input.checked)
		.map((input) => input.value);
}

describe("MultiSelectField", () => {
	it("summarises the current selection on the trigger", () => {
		renderField(["11", "84"]);

		expect(
			screen.getByRole("button", { name: /2 options sélectionnées/ }),
		).toBeInTheDocument();
	});

	it("invites a selection when nothing is picked", () => {
		renderField();

		expect(
			screen.getByRole("button", { name: /Sélectionner des options/ }),
		).toBeInTheDocument();
	});

	it("opens and closes the option panel", async () => {
		const user = userEvent.setup();
		renderField();
		const trigger = screen.getByRole("button", {
			name: /Sélectionner des options/,
		});

		expect(trigger).toHaveAttribute("aria-expanded", "false");
		await user.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(
			screen.getByRole("checkbox", { name: "Île-de-France" }),
		).toBeVisible();
	});

	it("submits one query value per checked option", async () => {
		const user = userEvent.setup();
		const { container } = renderField();

		await user.click(
			screen.getByRole("button", { name: /Sélectionner des options/ }),
		);
		await user.click(screen.getByRole("checkbox", { name: "Bretagne" }));

		expect(submittedValues(container, "region")).toEqual(["53"]);
	});

	it("selects then clears every option from the same control", async () => {
		const user = userEvent.setup();
		const { container } = renderField();

		await user.click(
			screen.getByRole("button", { name: /Sélectionner des options/ }),
		);
		await user.click(screen.getByRole("button", { name: /Tout sélectionner/ }));
		expect(submittedValues(container, "region")).toEqual(["11", "84", "53"]);

		await user.click(
			screen.getByRole("button", { name: /Tout désélectionner/ }),
		);
		expect(submittedValues(container, "region")).toEqual([]);
	});

	it("keeps a selection that the filter hides", async () => {
		const user = userEvent.setup();
		const { container } = renderField(["53"], true);

		await user.click(
			screen.getByRole("button", { name: /1 option sélectionnée/ }),
		);
		await user.type(screen.getByRole("searchbox"), "Auvergne");

		// Bretagne is filtered out of the list but must still reach the server.
		expect(
			screen.queryByRole("checkbox", { name: "Bretagne" }),
		).not.toBeInTheDocument();
		expect(submittedValues(container, "region")).toEqual(["53"]);
	});

	it("closes on Escape and returns focus to the trigger", async () => {
		const user = userEvent.setup();
		renderField();
		const trigger = screen.getByRole("button", {
			name: /Sélectionner des options/,
		});

		await user.click(trigger);
		await user.keyboard("{Escape}");

		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(trigger).toHaveFocus();
	});

	it("filters the options without matching accents", async () => {
		const user = userEvent.setup();
		renderField([], true);

		await user.click(
			screen.getByRole("button", { name: /Sélectionner des options/ }),
		);
		await user.type(screen.getByRole("searchbox"), "ile-de-france");

		expect(
			screen.getByRole("checkbox", { name: "Île-de-France" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", { name: "Bretagne" }),
		).not.toBeInTheDocument();
	});
});

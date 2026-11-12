import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DsfrTable } from "~/modules/shared/DsfrTable";

describe("DsfrTable", () => {
	it("hides the caption through the DSFR no-caption table", () => {
		const { container } = render(
			<DsfrTable caption="Test caption">
				<tbody>
					<tr>
						<td>Content</td>
					</tr>
				</tbody>
			</DsfrTable>,
		);

		expect(screen.getByText("Test caption")).toBeInTheDocument();
		expect(container.querySelector(".fr-table")).toHaveClass(
			"fr-table--no-caption",
		);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("applies default className fr-mb-4w", () => {
		const { container } = render(
			<DsfrTable caption="Caption">
				<tbody>
					<tr>
						<td>Cell</td>
					</tr>
				</tbody>
			</DsfrTable>,
		);

		const wrapper = container.querySelector(".fr-table");
		expect(wrapper).toHaveClass("fr-mb-4w");
	});

	it("applies custom className", () => {
		const { container } = render(
			<DsfrTable caption="Caption" className="fr-mt-2w">
				<tbody>
					<tr>
						<td>Cell</td>
					</tr>
				</tbody>
			</DsfrTable>,
		);

		const wrapper = container.querySelector(".fr-table");
		expect(wrapper).toHaveClass("fr-mt-2w");
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiblingDeclarationsSection } from "../SiblingDeclarationsSection";

const SIBLING_ID_1 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const SIBLING_ID_2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

describe("SiblingDeclarationsSection", () => {
	it("renders nothing when siblings array is empty", () => {
		const { container } = render(<SiblingDeclarationsSection siblings={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders section heading when siblings exist", () => {
		render(
			<SiblingDeclarationsSection
				siblings={[
					{
						id: SIBLING_ID_1,
						status: "submitted",
						cancelledAt: null,
						updatedAt: new Date("2026-03-10T12:00:00Z"),
					},
				]}
			/>,
		);

		expect(
			screen.getByRole("heading", {
				level: 3,
				name: "Autres déclarations pour ce SIREN / cette année",
			}),
		).toBeInTheDocument();
	});

	it("renders a link to each sibling detail page", () => {
		render(
			<SiblingDeclarationsSection
				siblings={[
					{
						id: SIBLING_ID_1,
						status: "submitted",
						cancelledAt: null,
						updatedAt: new Date("2026-03-10T12:00:00Z"),
					},
				]}
			/>,
		);

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", `/admin/declarations/${SIBLING_ID_1}`);
	});

	it("shows cancelled badge for cancelled siblings", () => {
		render(
			<SiblingDeclarationsSection
				siblings={[
					{
						id: SIBLING_ID_1,
						status: "cancelled",
						cancelledAt: new Date("2026-04-01"),
						updatedAt: new Date("2026-04-01T10:00:00Z"),
					},
				]}
			/>,
		);

		expect(screen.getByText("Annulée")).toBeInTheDocument();
	});

	it("shows status label for non-cancelled siblings", () => {
		render(
			<SiblingDeclarationsSection
				siblings={[
					{
						id: SIBLING_ID_1,
						status: "submitted",
						cancelledAt: null,
						updatedAt: new Date("2026-03-10T12:00:00Z"),
					},
				]}
			/>,
		);

		const listitem = screen.getByRole("listitem");
		expect(listitem).toHaveTextContent("Transmise");
	});

	it("renders multiple siblings", () => {
		render(
			<SiblingDeclarationsSection
				siblings={[
					{
						id: SIBLING_ID_1,
						status: "submitted",
						cancelledAt: null,
						updatedAt: new Date("2026-03-10T12:00:00Z"),
					},
					{
						id: SIBLING_ID_2,
						status: "cancelled",
						cancelledAt: new Date("2026-04-01"),
						updatedAt: new Date("2026-04-01T10:00:00Z"),
					},
				]}
			/>,
		);

		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute(
			"href",
			`/admin/declarations/${SIBLING_ID_1}`,
		);
		expect(links[1]).toHaveAttribute(
			"href",
			`/admin/declarations/${SIBLING_ID_2}`,
		);
	});
});

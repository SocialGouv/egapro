import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page, { metadata } from "~/app/admin/plan/page";

describe("/admin/plan route", () => {
	it("renders the backoffice plan", () => {
		render(<Page />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Plan du back-office" }),
		).toBeInTheDocument();
	});

	it("names the browser tab after the plan", () => {
		expect(metadata.title).toBe("Plan du back-office");
	});
});

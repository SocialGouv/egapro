import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mockImpersonatingSession } from "~/test/impersonationMock";
import { DeclarationLink } from "../DeclarationLink";

const mockedUseSession = vi.mocked(useSession);

describe("DeclarationLink", () => {
	afterEach(() => {
		mockedUseSession.mockReset();
	});

	it("renders remuneration as a button opening the process panel when info is present", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="remuneration"
				userPhone="0122334455"
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute(
			"aria-controls",
			"declaration-process-panel",
		);
	});

	it("renders as a button opening missing info modal when userPhone is null", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="remuneration"
				userPhone={null}
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
	});

	it("renders as a button opening missing info modal when hasCse is null and CSE is applicable", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={null}
				type="remuneration"
				userPhone="0122334455"
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
	});

	it("navigates normally when hasCse is null but CSE is not applicable", () => {
		render(
			<DeclarationLink
				cseApplicable={false}
				hasCse={null}
				type="remuneration"
				userPhone="0122334455"
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute(
			"aria-controls",
			"declaration-process-panel",
		);
	});

	it("still opens the missing info modal for a missing phone when CSE is not applicable", () => {
		render(
			<DeclarationLink
				cseApplicable={false}
				hasCse={null}
				type="remuneration"
				userPhone={null}
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
	});

	it("stores the declaration type on buttons opening missing info modal", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="remuneration"
				userPhone={null}
			>
				Rémunération
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute("data-declaration-type", "remuneration");
	});

	it("renders representation as a button placeholder when info is present", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="representation"
				userPhone="0122334455"
			>
				Représentation
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Représentation" });
		expect(button).toBeInTheDocument();
	});

	it("bypasses missing info modal during admin impersonation", () => {
		mockImpersonatingSession(mockedUseSession);

		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={null}
				type="remuneration"
				userPhone={null}
			>
				Rémunération
			</DeclarationLink>,
		);

		const button = screen.getByRole("button", { name: "Rémunération" });
		expect(button).toHaveAttribute(
			"aria-controls",
			"declaration-process-panel",
		);
	});
});

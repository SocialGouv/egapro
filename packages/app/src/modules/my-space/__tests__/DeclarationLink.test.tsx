import { fireEvent, render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { mockImpersonatingSession } from "~/test/impersonationMock";
import { DeclarationLink } from "../DeclarationLink";

vi.mock("~/modules/analytics", async (importOriginal) => ({
	...(await importOriginal<typeof import("~/modules/analytics")>()),
	trackEvent: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);
const mockedTrackEvent = vi.mocked(trackEvent);

describe("DeclarationLink", () => {
	afterEach(() => {
		mockedUseSession.mockReset();
		mockedTrackEvent.mockReset();
	});

	it.each([
		"remuneration",
		"representation",
	] as const)("tracks the démarche start when the %s panel is opened", (type) => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type={type}
				userPhone="0122334455"
			>
				Démarche
			</DeclarationLink>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Démarche" }));

		expect(mockedTrackEvent).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.DASHBOARD,
			action: MATOMO_ACTION.DECLARATION_START,
			name: type,
		});
	});

	it("does not track a démarche start when the missing info modal is opened instead", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="representation"
				userPhone={null}
			>
				Démarche
			</DeclarationLink>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Démarche" }));

		expect(mockedTrackEvent).not.toHaveBeenCalled();
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

	it("renders representation as a button opening the representation panel when info is present", () => {
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
		expect(button).toHaveAttribute(
			"aria-controls",
			"representation-process-panel",
		);
		expect(button).toHaveAttribute("data-fr-opened", "false");
	});

	it("still opens the missing info modal for representation when info is missing", () => {
		render(
			<DeclarationLink
				cseApplicable={true}
				hasCse={true}
				type="representation"
				userPhone={null}
			>
				Représentation
			</DeclarationLink>,
		);
		const button = screen.getByRole("button", { name: "Représentation" });
		expect(button).toHaveAttribute("aria-controls", "missing-info-modal");
		expect(button).toHaveAttribute("data-declaration-type", "representation");
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

import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
	"~/trpc/react",
	async () => await import("~/test/resendReceiptApiMock"),
);

import type { SubmissionBannerState } from "~/modules/cseOpinion/submissionBanner";
import {
	markDeclarationTransmissionSuccess,
	markJointEvaluationTransmissionSuccess,
} from "~/modules/declaration-remuneration/shared/declarationSuccessFlash";
import {
	FreshTransmissionBanner,
	getFreshTransmissionTitle,
	useFreshTransmission,
} from "../FreshTransmissionBanner";

const JOINT_EVALUATION: SubmissionBannerState = {
	variant: "joint_evaluation",
	depositModifiable: true,
};
const SECOND_DECLARATION: SubmissionBannerState = {
	variant: "second_declaration",
	depositModifiable: true,
};

describe("useFreshTransmission", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	it("returns null without a banner nor a fresh signal", () => {
		const { result } = renderHook(() => useFreshTransmission(null));

		expect(result.current).toBeNull();
	});

	it("keeps the second declaration banner without any signal", () => {
		const { result } = renderHook(() =>
			useFreshTransmission(SECOND_DECLARATION),
		);

		expect(result.current).toBe("compliance_path");
	});

	it("shows the joint evaluation banner only right after its transmission", () => {
		expect(
			renderHook(() => useFreshTransmission(JOINT_EVALUATION)).result.current,
		).toBeNull();

		markJointEvaluationTransmissionSuccess();
		expect(
			renderHook(() => useFreshTransmission(JOINT_EVALUATION)).result.current,
		).toBe("compliance_path");
	});

	it("reports a declaration just transmitted when no compliance path banner applies", () => {
		markDeclarationTransmissionSuccess();
		const { result } = renderHook(() => useFreshTransmission(null));

		expect(result.current).toBe("declaration");
	});

	it("lets the compliance path banner win over a declaration signal", () => {
		markDeclarationTransmissionSuccess();
		const { result } = renderHook(() =>
			useFreshTransmission(SECOND_DECLARATION),
		);

		expect(result.current).toBe("compliance_path");
	});
});

describe("getFreshTransmissionTitle", () => {
	it.each([
		[
			"compliance_path",
			"Parcours de mise en conformité pour l'indicateur par catégorie d'emplois",
		],
		["declaration", "Déclaration des indicateurs de rémunération 2026"],
		[null, null],
	] as const)("titles %s as %s", (freshTransmission, title) => {
		expect(getFreshTransmissionTitle(freshTransmission, 2026)).toBe(title);
	});
});

describe("FreshTransmissionBanner", () => {
	function renderBanner(
		props: Partial<Parameters<typeof FreshTransmissionBanner>[0]>,
	) {
		return render(
			<FreshTransmissionBanner
				banner={null}
				cseDeadline={new Date("2027-08-01T00:00:00Z")}
				declarationModifiable
				email="declarant@example.fr"
				freshTransmission={null}
				year={2026}
				{...props}
			/>,
		);
	}

	it("renders nothing without a fresh transmission", () => {
		const { container } = renderBanner({});

		expect(container).toBeEmptyDOMElement();
	});

	it("renders the declaration banner for a declaration just transmitted", () => {
		renderBanner({ freshTransmission: "declaration" });

		expect(
			screen.getByText("Votre déclaration a été transmise"),
		).toBeInTheDocument();
	});

	it("renders the compliance path banner of the page", () => {
		renderBanner({
			banner: SECOND_DECLARATION,
			freshTransmission: "compliance_path",
		});

		expect(
			screen.getByText("Votre seconde déclaration a été transmise"),
		).toBeInTheDocument();
	});
});

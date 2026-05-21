import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { CompliancePathChoice } from "../CompliancePathChoice";

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({
		useDeclarationDraft: vi.fn(() => ({
			draft: {},
			setField: () => undefined,
			clearDraft: () => undefined,
			hasDraft: false,
			isLoadingDraft: true,
			isSaving: false,
			isPendingSave: false,
		})),
	}),
);

import { JointEvaluationForm } from "../jointEvaluation/JointEvaluationForm";
import { Step1Workforce } from "../Step1Workforce";
import { Step2PayGap } from "../Step2PayGap";
import { Step3VariablePay } from "../Step3VariablePay";
import { Step4QuartileDistribution } from "../Step4QuartileDistribution";
import { Step5EmployeeCategories } from "../Step5EmployeeCategories";
import { SecondDeclarationStep1Info } from "../secondDeclaration/SecondDeclarationStep1Info";
import { SecondDeclarationStep2Form } from "../secondDeclaration/SecondDeclarationStep2Form";

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateStep1: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			updateStep2: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			updateStep3: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			updateStep4: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			updateEmployeeCategories: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			saveCompliancePath: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
			submitJointEvaluation: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false }),
			},
		},
	},
}));

const loadingDraftResult = {
	draft: {},
	setField: () => undefined,
	clearDraft: () => undefined,
	hasDraft: false,
	isLoadingDraft: true,
	isSaving: false,
	isPendingSave: false,
};

function mockLoadingDraft() {
	vi.mocked(useDeclarationDraft).mockReturnValue(loadingDraftResult);
}

function expectLoadingState() {
	const status = screen.getByRole("status");
	expect(status).toHaveTextContent(/Chargement du brouillon/i);
}

const emptyStep1 = { totalWomen: 0, totalMen: 0 };
const emptyStep2 = {
	indicatorAAnnualWomen: "",
	indicatorAAnnualMen: "",
	indicatorAHourlyWomen: "",
	indicatorAHourlyMen: "",
	indicatorBAnnualWomen: "",
	indicatorBAnnualMen: "",
	indicatorBHourlyWomen: "",
	indicatorBHourlyMen: "",
	indicatorCAnnualWomen: "",
	indicatorCAnnualMen: "",
	indicatorCHourlyWomen: "",
	indicatorCHourlyMen: "",
	indicatorDAnnualWomen: "",
	indicatorDAnnualMen: "",
	indicatorDHourlyWomen: "",
	indicatorDHourlyMen: "",
};
const emptyStep3 = {
	...emptyStep2,
	indicatorEWomen: "",
	indicatorEMen: "",
};
const emptyQuartile = [
	{ threshold: undefined, women: undefined, men: undefined },
	{ threshold: undefined, women: undefined, men: undefined },
	{ threshold: undefined, women: undefined, men: undefined },
	{ threshold: undefined, women: undefined, men: undefined },
];
const emptyStep4 = {
	annual: emptyQuartile,
	hourly: emptyQuartile,
};

describe("DraftLoadingGate", () => {
	it("Step1 renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<Step1Workforce
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep1}
			/>,
		);
		expectLoadingState();
	});

	it("Step2 renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<Step2PayGap
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep2}
			/>,
		);
		expectLoadingState();
	});

	it("Step3 renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<Step3VariablePay
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep3}
			/>,
		);
		expectLoadingState();
	});

	it("Step4 renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<Step4QuartileDistribution
				declarationSiren="123456789"
				declarationYear={2026}
				initialData={emptyStep4}
			/>,
		);
		expectLoadingState();
	});

	it("Step5 renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<Step5EmployeeCategories
				declarationSiren="123456789"
				declarationYear={2026}
				initialCategories={[]}
				initialSource={undefined}
			/>,
		);
		expectLoadingState();
	});

	it("CompliancePathChoice renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<CompliancePathChoice
				campaignDeadlines={{
					gipPublicationDate: null,
					campaignStartDate: null,
					decl1ModificationDeadline: new Date("2026-03-01"),
					decl2ModificationDeadline: new Date("2026-09-01"),
					decl1JustificationDeadline: new Date("2026-03-01"),
					decl1JointEvaluationDeadline: new Date("2026-05-01"),
					decl2JustificationDeadline: new Date("2026-09-01"),
					decl2JointEvaluationDeadline: new Date("2026-11-01"),
				}}
				currentYear={2026}
				declarationSiren="123456789"
				declarationYear={2026}
				email="user@example.com"
			/>,
		);
		expectLoadingState();
	});

	it("SecondDeclarationStep1Info renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<SecondDeclarationStep1Info
				declarationDate="01/01/2026"
				declarationSiren="123456789"
				declarationYear={2026}
				modificationDeadline={new Date("2026-09-01")}
			/>,
		);
		expectLoadingState();
	});

	it("SecondDeclarationStep2Form renders loading skeleton while draft is loading", () => {
		mockLoadingDraft();
		render(
			<SecondDeclarationStep2Form
				declarationSiren="123456789"
				declarationYear={2026}
				initialFirstDeclarationCategories={[]}
			/>,
		);
		expectLoadingState();
	});

	it("JointEvaluationForm consumes the hook without crashing while draft is loading", () => {
		mockLoadingDraft();
		const { container } = render(
			<JointEvaluationForm
				declarationDate="01/01/2026"
				declarationSiren="123456789"
				declarationYear={2026}
				hasCse={null}
				jointEvaluationDeadline={new Date("2026-05-01")}
			/>,
		);
		expect(container).toBeTruthy();
	});
});

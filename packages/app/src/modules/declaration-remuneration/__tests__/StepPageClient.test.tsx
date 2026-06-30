import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

vi.mock(import("~/modules/analytics"), async (importOriginal) => ({
	...(await importOriginal()),
	useFunnelTracking: vi.fn(),
}));

const acquireMutateAsync = vi.fn();
const heartbeatMutateAsync = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		declarationLock: {
			acquireLock: { useMutation: () => ({ mutateAsync: acquireMutateAsync }) },
			heartbeat: { useMutation: () => ({ mutateAsync: heartbeatMutateAsync }) },
		},
	},
}));

vi.mock("../steps/Step1Workforce", () => ({
	Step1Workforce: () => <div data-testid="step-1" />,
}));
vi.mock("../steps/Step2PayGap", () => ({
	Step2PayGap: () => <div data-testid="step-2" />,
}));
vi.mock("../steps/Step3VariablePay", () => ({
	Step3VariablePay: () => <div data-testid="step-3" />,
}));
vi.mock("../steps/Step4QuartileDistribution", () => ({
	Step4QuartileDistribution: () => <div data-testid="step-4" />,
}));
vi.mock("../steps/Step5EmployeeCategories", () => ({
	Step5EmployeeCategories: () => <div data-testid="step-5" />,
}));
vi.mock("../steps/Step6Review", () => ({
	Step6Review: () => <div data-testid="step-6" />,
}));

import { StepPageClient } from "../StepPageClient";

const useSessionMock = useSession as unknown as Mock;

const DEADLINE = new Date("2026-03-01T00:00:00Z");

const baseProps = {
	step: 1,
	declaration: {
		id: "decl-1",
		siren: "123456789",
		year: 2025,
		totalWomen: null,
		totalMen: null,
		status: "submitted" as string | null,
	},
	companyWorkforce: 120,
	step1Data: {} as never,
	step2Data: {} as never,
	step3Data: {} as never,
	step4Data: {} as never,
	step5Categories: [],
};

describe("StepPageClient — modification closed banner (#3716)", () => {
	beforeEach(() => {
		acquireMutateAsync.mockReset();
		heartbeatMutateAsync.mockReset();
		useSessionMock.mockReturnValue({
			data: { user: { id: "user-1", impersonation: null } },
			status: "authenticated",
		});
	});

	afterEach(() => {
		useSessionMock.mockReset();
	});

	it("renders the read-only banner with the deadline when modification is closed", () => {
		render(
			<StepPageClient
				{...baseProps}
				modificationClosed
				modificationDeadline={DEADLINE}
			/>,
		);

		const paragraph = screen
			.getByText(/Votre déclaration n'est plus modifiable/)
			.closest("p");
		expect(paragraph?.textContent).toContain(
			"modification close depuis le 1er mars 2026",
		);
		expect(screen.getByTestId("step-1")).toBeInTheDocument();
	});

	it("does not acquire the collaborative lock when modification is closed", () => {
		render(
			<StepPageClient
				{...baseProps}
				modificationClosed
				modificationDeadline={DEADLINE}
			/>,
		);

		expect(acquireMutateAsync).not.toHaveBeenCalled();
	});

	it("does not render the banner when modification is open (the regression: step stays editable)", () => {
		acquireMutateAsync.mockResolvedValue({ acquired: true, holder: null });
		render(<StepPageClient {...baseProps} modificationClosed={false} />);

		expect(
			screen.queryByText(/Votre déclaration n'est plus modifiable/),
		).not.toBeInTheDocument();
		expect(screen.getByTestId("step-1")).toBeInTheDocument();
	});

	it("does not render the banner when closed but no deadline is provided", () => {
		render(<StepPageClient {...baseProps} modificationClosed />);

		expect(
			screen.queryByText(/Votre déclaration n'est plus modifiable/),
		).not.toBeInTheDocument();
	});

	it("renders the recap step (6) under the closed banner", () => {
		render(
			<StepPageClient
				{...baseProps}
				modificationClosed
				modificationDeadline={DEADLINE}
				step={6}
			/>,
		);

		expect(screen.getByTestId("step-6")).toBeInTheDocument();
		expect(
			screen.getByText(/Votre déclaration n'est plus modifiable/),
		).toBeInTheDocument();
	});
});

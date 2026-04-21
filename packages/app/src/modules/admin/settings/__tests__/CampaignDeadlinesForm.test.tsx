import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	upsertMutate,
	upsertState,
	queryState,
	invalidateDeadlines,
	invalidateOverview,
} = vi.hoisted(() => ({
	upsertMutate: vi.fn(),
	upsertState: { isPending: false } as {
		isPending: boolean;
		onSuccess?: () => Promise<void> | void;
		onError?: (err: { message: string }) => void;
	},
	queryState: { data: undefined, isLoading: false } as {
		data:
			| {
					year: number;
					exists: boolean;
					gipPublicationDate: string | null;
					campaignStartDate: string | null;
					decl1ModificationDeadline: string;
					decl1JustificationDeadline: string;
					decl1JointEvaluationDeadline: string;
					decl2ModificationDeadline: string;
					decl2JustificationDeadline: string;
					decl2JointEvaluationDeadline: string;
			  }
			| undefined;
		isLoading: boolean;
	},
	invalidateDeadlines: vi.fn().mockResolvedValue(undefined),
	invalidateOverview: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		adminSettings: {
			getDeadlinesByYear: {
				useQuery: () => queryState,
				invalidate: invalidateDeadlines,
			},
			upsertCampaignDeadlines: {
				useMutation: (opts: {
					onSuccess?: () => Promise<void> | void;
					onError?: (err: { message: string }) => void;
				}) => {
					upsertState.onSuccess = opts.onSuccess;
					upsertState.onError = opts.onError;
					return { mutate: upsertMutate, isPending: upsertState.isPending };
				},
			},
			getOverview: { invalidate: invalidateOverview },
		},
		useUtils: () => ({
			adminSettings: {
				getDeadlinesByYear: { invalidate: invalidateDeadlines },
				getOverview: { invalidate: invalidateOverview },
			},
		}),
	},
}));

import { CampaignDeadlinesForm } from "../CampaignDeadlinesForm";

const sampleData = {
	year: 2026,
	exists: true,
	gipPublicationDate: "2026-03-01",
	campaignStartDate: "2026-03-15",
	decl1ModificationDeadline: "2026-06-01",
	decl1JustificationDeadline: "2026-06-01",
	decl1JointEvaluationDeadline: "2026-08-01",
	decl2ModificationDeadline: "2026-12-01",
	decl2JustificationDeadline: "2026-12-01",
	decl2JointEvaluationDeadline: "2027-02-01",
};

describe("CampaignDeadlinesForm", () => {
	beforeEach(() => {
		upsertMutate.mockReset();
		invalidateDeadlines.mockClear();
		invalidateOverview.mockClear();
		upsertState.isPending = false;
		queryState.data = sampleData;
		queryState.isLoading = false;
	});

	it("lists every year since FIRST_DECLARATION_YEAR up to next year", () => {
		render(
			<CampaignDeadlinesForm
				configuredYears={[2024, 2025, 2026]}
				initialYear={2026}
			/>,
		);
		const select = screen.getByLabelText(
			/sélectionnez l'année de campagne à modifier/i,
		);
		const values = Array.from(select.querySelectorAll("option")).map(
			(o) => o.value,
		);
		// Includes configured years and at least the current + next year.
		expect(values).toEqual(
			expect.arrayContaining(["2019", "2024", "2025", "2026"]),
		);
	});

	it("flags non-configured years with a hint suffix", () => {
		render(
			<CampaignDeadlinesForm
				configuredYears={[2024, 2025]}
				initialYear={2025}
			/>,
		);
		const select = screen.getByLabelText(
			/sélectionnez l'année de campagne à modifier/i,
		);
		const options = Array.from(select.querySelectorAll("option"));
		const labelFor = (year: string) =>
			options.find((o) => o.value === year)?.textContent;
		expect(labelFor("2024")).toBe("2024");
		expect(labelFor("2026")).toMatch(/non configurée/i);
	});

	it("populates editable fields from the query and shows the GIP date read-only", async () => {
		render(
			<CampaignDeadlinesForm configuredYears={[2026]} initialYear={2026} />,
		);
		await waitFor(() => {
			expect(
				document.getElementById("settings-decl1ModificationDeadline"),
			).toHaveValue("2026-06-01");
		});
		const gipField = screen.getByLabelText(
			/date de publication des données gip/i,
		);
		expect(gipField).toHaveValue("2026-03-01");
		expect(gipField).toHaveAttribute("readonly");
	});

	it("submits the form values on save", async () => {
		render(
			<CampaignDeadlinesForm configuredYears={[2026]} initialYear={2026} />,
		);
		await waitFor(() => {
			expect(
				document.getElementById("settings-decl1ModificationDeadline"),
			).toHaveValue("2026-06-01");
		});
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => {
			expect(upsertMutate).toHaveBeenCalled();
		});
		const firstCall = upsertMutate.mock.calls[0];
		expect(firstCall?.[0]).toMatchObject({
			year: 2026,
			decl1ModificationDeadline: "2026-06-01",
		});
	});

	it("shows a success alert and invalidates queries on success", async () => {
		render(
			<CampaignDeadlinesForm configuredYears={[2026]} initialYear={2026} />,
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /enregistrer/i }),
			).toBeEnabled(),
		);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		await upsertState.onSuccess?.();
		await waitFor(() => {
			expect(screen.getByText(/échéances enregistrées/i)).toBeInTheDocument();
		});
		expect(invalidateDeadlines).toHaveBeenCalled();
		expect(invalidateOverview).toHaveBeenCalled();
	});

	it("surfaces the server error when the mutation fails", async () => {
		render(
			<CampaignDeadlinesForm configuredYears={[2026]} initialYear={2026} />,
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: /enregistrer/i }),
			).toBeEnabled(),
		);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		upsertState.onError?.({ message: "Invalid payload" });
		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Invalid payload");
		});
	});
});

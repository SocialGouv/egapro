import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CampaignData = {
	year: number;
	isDefault: boolean;
	campaignStartDate: string;
	campaignEndDate: string;
	declarationDeadline: string;
};

const { upsertMutate, upsertState, queryState, invalidateCampaign, refetch } =
	vi.hoisted(() => ({
		upsertMutate: vi.fn(),
		upsertState: { isPending: false } as {
			isPending: boolean;
			onSuccess?: (
				result: { success: true },
				variables: { year: number },
			) => Promise<void> | void;
			onError?: (err: { message: string }) => void;
		},
		queryState: { dataByYear: {}, isLoading: false, isError: false } as {
			dataByYear: Record<number, unknown>;
			isLoading: boolean;
			isError: boolean;
		},
		refetch: vi.fn().mockResolvedValue(undefined),
		invalidateCampaign: vi.fn().mockResolvedValue(undefined),
	}));

vi.mock("~/trpc/react", () => ({
	api: {
		adminSettings: {
			getRepresentationCampaignByYear: {
				useQuery: (input: { year: number }) => ({
					data: queryState.dataByYear[input.year],
					isLoading: queryState.isLoading,
					isError: queryState.isError,
					refetch,
				}),
				invalidate: invalidateCampaign,
			},
			upsertRepresentationCampaign: {
				useMutation: (opts: {
					onSuccess?: typeof upsertState.onSuccess;
					onError?: typeof upsertState.onError;
				}) => {
					upsertState.onSuccess = opts.onSuccess;
					upsertState.onError = opts.onError;
					return { mutate: upsertMutate, isPending: upsertState.isPending };
				},
			},
		},
		useUtils: () => ({
			adminSettings: {
				getRepresentationCampaignByYear: { invalidate: invalidateCampaign },
			},
		}),
	},
}));

import { RepresentationCampaignForm } from "../RepresentationCampaignForm";

const storedCampaign: CampaignData = {
	year: 2026,
	isDefault: false,
	campaignStartDate: "2026-02-01",
	campaignEndDate: "2026-11-30",
	declarationDeadline: "2026-04-15",
};

const defaultCampaign: CampaignData = {
	year: 2027,
	isDefault: true,
	campaignStartDate: "2027-01-01",
	campaignEndDate: "2027-12-31",
	declarationDeadline: "2027-03-01",
};

const startInput = () =>
	document.getElementById(
		"representation-settings-campaignStartDate",
	) as HTMLInputElement;
const endInput = () =>
	document.getElementById(
		"representation-settings-campaignEndDate",
	) as HTMLInputElement;
const deadlineInput = () =>
	document.getElementById(
		"representation-settings-declarationDeadline",
	) as HTMLInputElement;

describe("RepresentationCampaignForm", () => {
	beforeEach(() => {
		upsertMutate.mockReset();
		invalidateCampaign.mockClear();
		upsertState.isPending = false;
		queryState.isLoading = false;
		queryState.isError = false;
		refetch.mockClear();
		queryState.dataByYear = {
			2026: storedCampaign,
			2027: defaultCampaign,
		};
	});

	it("populates the three date fields from the query", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => {
			expect(startInput()).toHaveValue("2026-02-01");
		});
		expect(endInput()).toHaveValue("2026-11-30");
		expect(deadlineInput()).toHaveValue("2026-04-15");
	});

	it("labels the declaration deadline field as an échéance", () => {
		render(<RepresentationCampaignForm year={2026} />);
		expect(
			screen.getByLabelText(/^échéance de déclaration/i),
		).toBeInTheDocument();
		expect(screen.queryByText(/date limite/i)).not.toBeInTheDocument();
	});

	it("has no year selector of its own", () => {
		render(<RepresentationCampaignForm year={2026} />);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});

	it("reloads the fields for the newly selected year", async () => {
		const { rerender } = render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		rerender(<RepresentationCampaignForm year={2027} />);

		await waitFor(() => expect(startInput()).toHaveValue("2027-01-01"));
		expect(endInput()).toHaveValue("2027-12-31");
		expect(deadlineInput()).toHaveValue("2027-03-01");
	});

	it("shows the default-values badge only when no override is stored", async () => {
		const { rerender } = render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));
		expect(screen.queryByText(/valeurs par défaut/i)).not.toBeInTheDocument();

		rerender(<RepresentationCampaignForm year={2027} />);

		await waitFor(() => {
			expect(screen.getByText(/valeurs par défaut/i)).toBeInTheDocument();
		});
	});

	it("submits the loaded values on save", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toMatchObject({
			year: 2026,
			campaignStartDate: "2026-02-01",
			campaignEndDate: "2026-11-30",
			declarationDeadline: "2026-04-15",
		});
	});

	it("submits the edited values rather than the loaded ones", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		fireEvent.change(startInput(), { target: { value: "2026-03-10" } });
		fireEvent.change(deadlineInput(), { target: { value: "2026-05-20" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toMatchObject({
			campaignStartDate: "2026-03-10",
			declarationDeadline: "2026-05-20",
		});
	});

	it("submits under the newly selected year, not the initial one", async () => {
		const { rerender } = render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		rerender(<RepresentationCampaignForm year={2027} />);
		await waitFor(() => expect(startInput()).toHaveValue("2027-01-01"));
		fireEvent.change(endInput(), { target: { value: "2027-11-30" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			campaignStartDate: "2027-01-01",
			campaignEndDate: "2027-11-30",
			declarationDeadline: "2027-03-01",
		});
	});

	it("blocks submission when the start date is not before the end date", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		fireEvent.change(endInput(), { target: { value: "2026-01-15" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

		await waitFor(() => {
			expect(
				screen.getByText(
					/la date de démarrage de la campagne doit être antérieure à la date de clôture/i,
				),
			).toBeInTheDocument();
		});
		expect(upsertMutate).not.toHaveBeenCalled();
		expect(endInput()).toHaveAttribute("aria-invalid", "true");
	});

	it("blocks submission when the start and end dates are equal", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		fireEvent.change(endInput(), { target: { value: "2026-02-01" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/antérieure à la date de clôture/i),
			).toBeInTheDocument();
		});
		expect(upsertMutate).not.toHaveBeenCalled();
	});

	it("shows a success alert and invalidates the query on success", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		await upsertState.onSuccess?.({ success: true }, { year: 2026 });

		await waitFor(() => {
			expect(
				screen.getByText(
					/campagne représentation équilibrée enregistrée pour 2026/i,
				),
			).toBeInTheDocument();
		});
		expect(invalidateCampaign).toHaveBeenCalledWith({ year: 2026 });
	});

	it("surfaces the server error when the mutation fails", async () => {
		render(<RepresentationCampaignForm year={2026} />);
		await waitFor(() => expect(startInput()).toHaveValue("2026-02-01"));

		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		upsertState.onError?.({ message: "Année déjà verrouillée" });

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Année déjà verrouillée",
			);
		});
	});

	it("disables the submit button while the query is loading", () => {
		queryState.isLoading = true;
		queryState.dataByYear = {};
		render(<RepresentationCampaignForm year={2026} />);
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();
	});

	it("blocks any submission and offers a retry when the initial load fails", async () => {
		queryState.isError = true;
		queryState.dataByYear = {};
		render(<RepresentationCampaignForm year={2026} />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			/n'ont pas pu être chargées/i,
		);
		const save = screen.getByRole("button", { name: /enregistrer/i });
		expect(save).toBeDisabled();
		fireEvent.submit(save.closest("form") as HTMLFormElement);
		await Promise.resolve();
		expect(upsertMutate).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("button", { name: /réessayer/i }));
		expect(refetch).toHaveBeenCalledTimes(1);
	});

	it("disables the submit button and shows progress while saving", async () => {
		upsertState.isPending = true;
		render(<RepresentationCampaignForm year={2026} />);
		expect(
			screen.getByRole("button", { name: /enregistrement…/i }),
		).toBeDisabled();
	});
});

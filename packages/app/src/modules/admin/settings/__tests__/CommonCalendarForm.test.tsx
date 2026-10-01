import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type DeadlinesData = {
	year: number;
	exists: boolean;
	gipPublicationDate: string | null;
	campaignStartDate: string | null;
	publicDataReleaseDate: string | null;
	decl1ModificationDeadline: string;
};

const { updateMutate, updateState, queryState, invalidateDeadlines } =
	vi.hoisted(() => ({
		updateMutate: vi.fn(),
		updateState: { isPending: false } as {
			isPending: boolean;
			onSuccess?: (
				result: { success: true },
				variables: { year: number },
			) => Promise<void> | void;
			onError?: (err: { message: string }) => void;
		},
		queryState: { data: undefined, isLoading: false } as {
			data: DeadlinesData | undefined;
			isLoading: boolean;
		},
		invalidateDeadlines: vi.fn().mockResolvedValue(undefined),
	}));

vi.mock("~/trpc/react", () => {
	const selected = new WeakMap<object, unknown>();
	return {
		api: {
			adminSettings: {
				getDeadlinesByYear: {
					useQuery: (
						_input: { year: number },
						opts: { select: (data: DeadlinesData) => unknown },
					) => {
						const raw = queryState.data;
						if (raw && !selected.has(raw)) selected.set(raw, opts.select(raw));
						return {
							data: raw ? selected.get(raw) : undefined,
							isLoading: queryState.isLoading,
						};
					},
				},
				updateCommonCalendar: {
					useMutation: (opts: {
						onSuccess?: typeof updateState.onSuccess;
						onError?: typeof updateState.onError;
					}) => {
						updateState.onSuccess = opts.onSuccess;
						updateState.onError = opts.onError;
						return { mutate: updateMutate, isPending: updateState.isPending };
					},
				},
			},
			useUtils: () => ({
				adminSettings: {
					getDeadlinesByYear: { invalidate: invalidateDeadlines },
				},
			}),
		},
	};
});

import { CommonCalendarForm } from "../CommonCalendarForm";

const configuredYear: DeadlinesData = {
	year: 2027,
	exists: true,
	gipPublicationDate: "2027-03-02",
	campaignStartDate: "2027-03-15",
	publicDataReleaseDate: "2028-01-15",
	decl1ModificationDeadline: "2027-06-01",
};

const startInput = () =>
	document.getElementById("settings-campaignStartDate") as HTMLInputElement;
const releaseInput = () =>
	document.getElementById("settings-publicDataReleaseDate") as HTMLInputElement;

async function renderLoaded() {
	render(<CommonCalendarForm year={2027} />);
	await waitFor(() => expect(releaseInput()).toHaveValue("2028-01-15"));
}

describe("CommonCalendarForm", () => {
	beforeEach(() => {
		updateMutate.mockReset();
		invalidateDeadlines.mockClear();
		updateState.isPending = false;
		queryState.data = { ...configuredYear };
		queryState.isLoading = false;
	});

	it("shows the GIP publication date read-only next to the two editable dates", async () => {
		await renderLoaded();
		const gip = screen.getByLabelText(/date de publication des données gip/i);
		expect(gip).toHaveValue("2027-03-02");
		expect(gip).toHaveAttribute("readonly");
		expect(startInput()).toHaveValue("2027-03-15");
		expect(startInput()).not.toBeDisabled();
	});

	it("falls back to 'Non disponible' when no GIP file has been imported", () => {
		queryState.data = { ...configuredYear, gipPublicationDate: null };
		render(<CommonCalendarForm year={2027} />);
		expect(
			screen.getByLabelText(/date de publication des données gip/i),
		).toHaveValue("Non disponible");
	});

	it("explains what the start and public release dates drive", () => {
		render(<CommonCalendarForm year={2027} />);
		expect(startInput()).toHaveAccessibleName(
			/n'ouvre ni ne ferme la saisie des déclarations/i,
		);
		expect(releaseInput()).toHaveAccessibleName(
			/indicateurs a à f et les écarts de représentation .* vide : non publiés/i,
		);
	});

	it("submits only the year, the start date and the public release date", async () => {
		await renderLoaded();
		fireEvent.change(releaseInput(), { target: { value: "2028-02-20" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		expect(updateMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			campaignStartDate: "2027-03-15",
			publicDataReleaseDate: "2028-02-20",
		});
	});

	it("submits cleared dates as null", async () => {
		queryState.data = {
			...configuredYear,
			campaignStartDate: null,
			publicDataReleaseDate: null,
		};
		render(<CommonCalendarForm year={2027} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		expect(updateMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			campaignStartDate: null,
			publicDataReleaseDate: null,
		});
	});

	it("is disabled with an invitation to save the remuneration deadlines when the year has no row", () => {
		queryState.data = {
			...configuredYear,
			exists: false,
			gipPublicationDate: null,
			campaignStartDate: null,
			publicDataReleaseDate: null,
		};
		render(<CommonCalendarForm year={2027} />);

		expect(
			screen.getByText(
				"Enregistrez d'abord les échéances de la démarche Rémunération pour 2027.",
			),
		).toBeInTheDocument();
		expect(startInput()).toBeDisabled();
		expect(releaseInput()).toBeDisabled();
		expect(screen.getByRole("group")).toHaveAccessibleDescription(
			/enregistrez d'abord les échéances/i,
		);
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();
	});

	it("becomes editable once the year's row exists", () => {
		queryState.data = { ...configuredYear, exists: false };
		const { rerender } = render(<CommonCalendarForm year={2027} />);
		expect(startInput()).toBeDisabled();

		queryState.data = { ...configuredYear, exists: true };
		rerender(<CommonCalendarForm year={2027} />);

		expect(startInput()).not.toBeDisabled();
		expect(
			screen.queryByText(/enregistrez d'abord les échéances/i),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeEnabled();
	});

	it("shows a success alert and invalidates the year on success", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		await updateState.onSuccess?.({ success: true }, { year: 2027 });
		await waitFor(() =>
			expect(
				screen.getByText("Calendrier de la campagne enregistré pour 2027."),
			).toBeInTheDocument(),
		);
		expect(invalidateDeadlines).toHaveBeenCalledWith({ year: 2027 });
	});

	it("surfaces the server refusal", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		updateState.onError?.({
			message:
				"Enregistrez d'abord les échéances de la démarche Rémunération pour 2027.",
		});
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				/enregistrez d'abord les échéances/i,
			),
		);
	});

	it("disables the submit button while the year is loading", () => {
		queryState.data = undefined;
		queryState.isLoading = true;
		render(<CommonCalendarForm year={2027} />);
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();
		expect(
			screen.queryByText(/enregistrez d'abord les échéances/i),
		).not.toBeInTheDocument();
	});

	it("disables the submit button and shows progress while saving", () => {
		updateState.isPending = true;
		render(<CommonCalendarForm year={2027} />);
		expect(
			screen.getByRole("button", { name: /enregistrement…/i }),
		).toBeDisabled();
	});
});

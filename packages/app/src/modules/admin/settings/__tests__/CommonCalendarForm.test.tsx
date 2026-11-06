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

const { updateMutate, updateState, queryState, invalidateDeadlines, refetch } =
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
		queryState: { data: undefined, isLoading: false, isError: false } as {
			data: DeadlinesData | undefined;
			isLoading: boolean;
			isError: boolean;
		},
		invalidateDeadlines: vi.fn().mockResolvedValue(undefined),
		refetch: vi.fn().mockResolvedValue(undefined),
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
							isError: queryState.isError,
							refetch,
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
		queryState.isError = false;
		refetch.mockClear();
	});

	it("shows only the two editable dates, without the GIP publication date", async () => {
		await renderLoaded();
		expect(startInput()).toHaveValue("2027-03-15");
		expect(startInput()).not.toBeDisabled();
		expect(screen.queryByLabelText(/données gip/i)).toBeNull();
		expect(document.getElementById("settings-gipPublicationDate")).toBeNull();
	});

	it("labels the opening and results publication dates with their hints", () => {
		render(<CommonCalendarForm year={2027} />);
		expect(startInput()).toHaveAccessibleName(
			/^Date d'ouverture de la campagne\s*Date à partir de laquelle les entreprises peuvent effectuer leur démarche\.$/,
		);
		expect(releaseInput()).toHaveAccessibleName(
			/^Date de publication des résultats\s*Date à partir de laquelle les indicateurs de rémunération et les indicateurs de représentation de cette campagne sont publiés\. Vide : non publiés\.$/,
		);
	});

	it("marks the opening date as required with a visible mention it cites", () => {
		render(<CommonCalendarForm year={2027} />);
		const note = screen.getByText(
			"La date d'ouverture de la campagne est obligatoire.",
		);
		expect(startInput()).toBeRequired();
		expect(startInput()).toHaveAttribute("aria-describedby", note.id);
		expect(releaseInput()).not.toBeRequired();
		expect(releaseInput()).not.toHaveAttribute("aria-describedby");
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

	it("submits a cleared public release date as null", async () => {
		queryState.data = { ...configuredYear, publicDataReleaseDate: null };
		render(<CommonCalendarForm year={2027} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		expect(updateMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			campaignStartDate: "2027-03-15",
			publicDataReleaseDate: null,
		});
	});

	it("blocks submission and flags the opening date when it is empty", async () => {
		queryState.data = { ...configuredYear, campaignStartDate: null };
		render(<CommonCalendarForm year={2027} />);
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() =>
			expect(startInput()).toHaveAttribute("aria-invalid", "true"),
		);
		expect(startInput().getAttribute("aria-describedby")).toContain(
			"settings-campaignStartDate-error",
		);
		expect(updateMutate).not.toHaveBeenCalled();
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
		expect(releaseInput()).toHaveValue("");
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

	it("blocks any submission and offers a retry when the initial load fails", async () => {
		queryState.data = undefined;
		queryState.isError = true;
		render(<CommonCalendarForm year={2027} />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			/n'ont pas pu être chargées/i,
		);
		const save = screen.getByRole("button", { name: /enregistrer/i });
		expect(save).toBeDisabled();
		fireEvent.submit(save.closest("form") as HTMLFormElement);
		await Promise.resolve();
		expect(updateMutate).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("button", { name: /réessayer/i }));
		expect(refetch).toHaveBeenCalledTimes(1);
	});

	it("keeps clearing the public release date possible after a successful load", async () => {
		await renderLoaded();
		fireEvent.change(releaseInput(), { target: { value: "" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(updateMutate).toHaveBeenCalled());
		expect(updateMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			campaignStartDate: "2027-03-15",
			publicDataReleaseDate: null,
		});
	});

	it("refuses to submit once the opening date is cleared after a successful load", async () => {
		await renderLoaded();
		fireEvent.change(startInput(), { target: { value: "" } });
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() =>
			expect(startInput()).toHaveAttribute("aria-invalid", "true"),
		);
		expect(updateMutate).not.toHaveBeenCalled();
	});

	it("does not show the load error while the data is available", () => {
		render(<CommonCalendarForm year={2027} />);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("disables the submit button and shows progress while saving", () => {
		updateState.isPending = true;
		render(<CommonCalendarForm year={2027} />);
		expect(
			screen.getByRole("button", { name: /enregistrement…/i }),
		).toBeDisabled();
	});
});

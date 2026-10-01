import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

type DeadlinesData = {
	year: number;
	exists: boolean;
	gipPublicationDate: string | null;
	campaignStartDate: string | null;
	publicDataReleaseDate: string | null;
	pathChoiceRound1Deadline: string;
	pathChoiceDeadline: string;
	decl1ModificationDeadline: string;
	decl1JustificationDeadline: string;
	decl1JointEvaluationDeadline: string;
	decl2ModificationDeadline: string;
	decl2JustificationDeadline: string;
	decl2JointEvaluationDeadline: string;
	decl2CseOpinionDeadline: string;
};

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
	invalidateOverview: vi.fn().mockResolvedValue(undefined),
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
				upsertRemunerationDeadlines: {
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
					getDeadlinesByYear: { invalidate: invalidateDeadlines },
					getOverview: { invalidate: invalidateOverview },
				},
			}),
		},
	};
});

import { RemunerationDeadlinesForm } from "../RemunerationDeadlinesForm";

const storedDeadlines: DeadlinesData = {
	year: 2027,
	exists: true,
	gipPublicationDate: "2027-03-01",
	campaignStartDate: "2027-03-15",
	publicDataReleaseDate: "2028-01-15",
	pathChoiceRound1Deadline: "2027-07-01",
	pathChoiceDeadline: "2028-01-01",
	decl1ModificationDeadline: "2027-06-01",
	decl1JustificationDeadline: "2028-03-01",
	decl1JointEvaluationDeadline: "2027-08-01",
	decl2ModificationDeadline: "2027-12-01",
	decl2JustificationDeadline: "2027-12-01",
	decl2JointEvaluationDeadline: "2028-01-01",
	decl2CseOpinionDeadline: "2028-02-01",
};

const fieldsetByLegend = (legend: string) =>
	screen
		.getByText(legend, { selector: "legend" })
		.closest("fieldset") as HTMLElement;

const inputById = (id: string) =>
	document.getElementById(id) as HTMLInputElement;

async function renderLoaded() {
	render(<RemunerationDeadlinesForm year={2027} />);
	await waitFor(() =>
		expect(inputById("settings-decl1ModificationDeadline")).toHaveValue(
			"2027-06-01",
		),
	);
}

describe("RemunerationDeadlinesForm", () => {
	beforeEach(() => {
		upsertMutate.mockReset();
		invalidateDeadlines.mockClear();
		invalidateOverview.mockClear();
		upsertState.isPending = false;
		queryState.data = { ...storedDeadlines };
		queryState.isLoading = false;
	});

	it("groups the deadlines in four fieldsets following the path order", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		const legends = Array.from(document.querySelectorAll("legend")).map(
			(legend) => legend.textContent,
		);
		expect(legends).toEqual([
			"Déclaration des indicateurs",
			"Parcours de mise en conformité — 1er tour",
			"Parcours de mise en conformité — 2nd tour",
			"Avis du CSE",
		]);
	});

	it("populates the seven editable deadlines from the query", async () => {
		await renderLoaded();
		expect(inputById("settings-decl1JustificationDeadline")).toHaveValue(
			"2028-03-01",
		);
		expect(inputById("settings-decl1JointEvaluationDeadline")).toHaveValue(
			"2027-08-01",
		);
		expect(inputById("settings-decl2ModificationDeadline")).toHaveValue(
			"2027-12-01",
		);
		expect(inputById("settings-decl2JustificationDeadline")).toHaveValue(
			"2027-12-01",
		);
		expect(inputById("settings-decl2JointEvaluationDeadline")).toHaveValue(
			"2028-01-01",
		);
		expect(inputById("settings-decl2CseOpinionDeadline")).toHaveValue(
			"2028-02-01",
		);
	});

	it("shows the derived path choice deadlines read-only in each round", async () => {
		await renderLoaded();
		const round1 = within(
			fieldsetByLegend("Parcours de mise en conformité — 1er tour"),
		).getByLabelText(/échéance de choix du parcours/i);
		const round2 = within(
			fieldsetByLegend("Parcours de mise en conformité — 2nd tour"),
		).getByLabelText(/échéance de choix du parcours/i);

		expect(round1).toHaveValue("2027-07-01");
		expect(round2).toHaveValue("2028-01-01");
		for (const field of [round1, round2]) {
			expect(field).toHaveAttribute("readonly");
			expect(field).toHaveAccessibleName(/calculée — non paramétrable/i);
		}
	});

	it("places each deadline in its round", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		const declaration = fieldsetByLegend("Déclaration des indicateurs");
		const round1 = fieldsetByLegend(
			"Parcours de mise en conformité — 1er tour",
		);
		const round2 = fieldsetByLegend(
			"Parcours de mise en conformité — 2nd tour",
		);
		const cse = fieldsetByLegend("Avis du CSE");

		expect(
			within(declaration).getByLabelText(/^échéance de déclaration/i),
		).toBeInTheDocument();
		expect(
			within(round1).getByLabelText(/^échéance de justification des écarts/i),
		).toBeInTheDocument();
		expect(
			within(round1).getByLabelText(
				/^échéance de dépôt du rapport d'évaluation conjointe/i,
			),
		).toBeInTheDocument();
		expect(
			within(round1).getByLabelText(
				/^échéance de la seconde déclaration \(actions correctives\)/i,
			),
		).toBeInTheDocument();
		expect(
			within(round2).getByLabelText(/^échéance de justification des écarts/i),
		).toBeInTheDocument();
		expect(
			within(round2).getByLabelText(
				/^échéance de dépôt du rapport d'évaluation conjointe/i,
			),
		).toBeInTheDocument();
		expect(
			within(cse).getByLabelText(/^échéance de dépôt de l'avis du cse/i),
		).toBeInTheDocument();
		for (const round of [round1, round2]) {
			expect(within(round).queryByLabelText(/avis du cse/i)).toBeNull();
		}
	});

	it("explains that the CSE opinion deadline applies whatever the path", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByLabelText(/^échéance de dépôt de l'avis du cse/i),
		).toHaveAccessibleName(/quel que soit le parcours/i);
	});

	it("does not display any 'date limite' label", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(screen.queryByText(/date limite/i)).not.toBeInTheDocument();
	});

	it("submits only the year and the seven deadlines, never the derived or common dates", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			decl1ModificationDeadline: "2027-06-01",
			decl1JustificationDeadline: "2028-03-01",
			decl1JointEvaluationDeadline: "2027-08-01",
			decl2ModificationDeadline: "2027-12-01",
			decl2JustificationDeadline: "2027-12-01",
			decl2JointEvaluationDeadline: "2028-01-01",
			decl2CseOpinionDeadline: "2028-02-01",
		});
	});

	it("submits the edited value rather than the loaded one", async () => {
		await renderLoaded();
		fireEvent.change(inputById("settings-decl1ModificationDeadline"), {
			target: { value: "2027-06-15" },
		});
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toMatchObject({
			decl1ModificationDeadline: "2027-06-15",
		});
	});

	it("blocks submission when the second declaration is not after the declaration", async () => {
		await renderLoaded();
		fireEvent.change(inputById("settings-decl2ModificationDeadline"), {
			target: { value: "2027-05-01" },
		});
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() =>
			expect(
				screen.getByText(/doit être postérieure à celle de la première/i),
			).toBeInTheDocument(),
		);
		expect(upsertMutate).not.toHaveBeenCalled();
		expect(inputById("settings-decl2ModificationDeadline")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
	});

	it("shows the default-values badge only when the year has no stored row", async () => {
		await renderLoaded();
		expect(screen.queryByText(/valeurs par défaut/i)).not.toBeInTheDocument();
	});

	it("flags defaulted deadlines with the default-values badge", () => {
		queryState.data = { ...storedDeadlines, exists: false };
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByText(
				"Valeurs par défaut — aucune surcharge enregistrée pour cette année",
			),
		).toBeInTheDocument();
	});

	it("leaves every deadline blank while the year is loading", () => {
		queryState.data = undefined;
		queryState.isLoading = true;
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(inputById("settings-decl2CseOpinionDeadline")).toHaveValue("");
		expect(
			within(
				fieldsetByLegend("Parcours de mise en conformité — 1er tour"),
			).getByLabelText(/échéance de choix du parcours/i),
		).toHaveValue("");
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();
		expect(screen.queryByText(/valeurs par défaut/i)).not.toBeInTheDocument();
	});

	it("shows a success alert and invalidates the year and the overview on success", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		await upsertState.onSuccess?.({ success: true }, { year: 2027 });
		await waitFor(() =>
			expect(
				screen.getByText("Échéances enregistrées pour 2027."),
			).toBeInTheDocument(),
		);
		expect(invalidateDeadlines).toHaveBeenCalledWith({ year: 2027 });
		expect(invalidateOverview).toHaveBeenCalled();
	});

	it("surfaces the server error when the mutation fails", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		upsertState.onError?.({ message: "Invalid payload" });
		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent("Invalid payload"),
		);
	});

	it("disables the submit button and shows progress while saving", () => {
		upsertState.isPending = true;
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByRole("button", { name: /enregistrement…/i }),
		).toBeDisabled();
	});
});

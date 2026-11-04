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
	refetch,
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
	queryState: { data: undefined, isLoading: false, isError: false } as {
		data: DeadlinesData | undefined;
		isLoading: boolean;
		isError: boolean;
	},
	refetch: vi.fn().mockResolvedValue(undefined),
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
							isError: queryState.isError,
							refetch,
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
	gipPublicationDate: "2027-03-02",
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
		queryState.isError = false;
		refetch.mockClear();
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

	it("populates the five editable deadlines from the query", async () => {
		await renderLoaded();
		expect(inputById("settings-decl1JointEvaluationDeadline")).toHaveValue(
			"2027-08-01",
		);
		expect(inputById("settings-decl2ModificationDeadline")).toHaveValue(
			"2027-12-01",
		);
		expect(inputById("settings-decl2JointEvaluationDeadline")).toHaveValue(
			"2028-01-01",
		);
		expect(inputById("settings-decl2CseOpinionDeadline")).toHaveValue(
			"2028-02-01",
		);
	});

	it("never shows the justification deadlines", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			document.getElementById("settings-decl1JustificationDeadline"),
		).toBeNull();
		expect(
			document.getElementById("settings-decl2JustificationDeadline"),
		).toBeNull();
		expect(screen.queryByLabelText(/justification des écarts/i)).toBeNull();
	});

	it("shows the derived path choice deadlines read-only in each round, without hint", async () => {
		await renderLoaded();
		const round1 = within(
			fieldsetByLegend("Parcours de mise en conformité — 1er tour"),
		).getByLabelText(/échéance pour le choix du parcours/i);
		const round2 = within(
			fieldsetByLegend("Parcours de mise en conformité — 2nd tour"),
		).getByLabelText(/échéance pour le choix du parcours/i);

		expect(round1).toHaveValue("2027-07-01");
		expect(round2).toHaveValue("2028-01-01");
		for (const field of [round1, round2]) {
			expect(field).toHaveAttribute("readonly");
			expect(field).toHaveAccessibleName("Échéance pour le choix du parcours");
		}
		expect(screen.queryByText(/calculée — non paramétrable/i)).toBeNull();
	});

	it("shows the GIP date read-only as the first field of the declaration group, in French format", async () => {
		await renderLoaded();
		const declaration = fieldsetByLegend("Déclaration des indicateurs");
		const gip = within(declaration).getByLabelText(
			/^date de mise à disposition des données gip/i,
		);
		expect(gip).toHaveValue("02/03/2027");
		expect(gip).toHaveAttribute("readonly");
		expect(gip).toHaveAccessibleName(
			/^Date de mise à disposition des données GIP\s*Lecture seule\. Date issue du fichier GIP récupéré depuis SUIT\.$/,
		);
		expect(declaration.querySelector("input")).toBe(gip);
		expect(
			document.querySelectorAll("#settings-gipPublicationDate"),
		).toHaveLength(1);
	});

	it("falls back to 'Non disponible' when no GIP file has been imported", () => {
		queryState.data = { ...storedDeadlines, gipPublicationDate: null };
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByLabelText(/^date de mise à disposition des données gip/i),
		).toHaveValue("Non disponible");
	});

	it("shows 'Non disponible' for the GIP date while the year is loading", () => {
		queryState.data = undefined;
		queryState.isLoading = true;
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByLabelText(/^date de mise à disposition des données gip/i),
		).toHaveValue("Non disponible");
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
			within(declaration).getByLabelText(/^échéance de la déclaration/i),
		).toBeInTheDocument();
		expect(
			within(round1).getByLabelText(
				/^échéance pour le dépôt du rapport de l'évaluation conjointe/i,
			),
		).toBeInTheDocument();
		expect(
			within(round1).getByLabelText(
				/^échéance de la seconde déclaration \(actions correctives\)/i,
			),
		).toBeInTheDocument();
		expect(
			within(round2).getByLabelText(
				/^échéance pour le dépôt du rapport de l'évaluation conjointe/i,
			),
		).toBeInTheDocument();
		expect(
			within(cse).getByLabelText(
				/^échéance pour le dépôt de l'avis ou des avis cse/i,
			),
		).toBeInTheDocument();
		for (const round of [round1, round2]) {
			expect(
				within(round).queryByLabelText(/avis ou des avis cse/i),
			).toBeNull();
		}
	});

	it("labels the CSE opinion deadline without any hint", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(
			screen.getByLabelText(
				/^échéance pour le dépôt de l'avis ou des avis cse/i,
			),
		).toHaveAccessibleName("Échéance pour le dépôt de l'avis ou des avis CSE");
		expect(screen.queryByText(/quel que soit le parcours/i)).toBeNull();
	});

	it("does not display any 'date limite' label", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		expect(screen.queryByText(/date limite/i)).not.toBeInTheDocument();
	});

	it("submits only the year and the five deadlines, never the derived, justification, GIP or common dates", async () => {
		await renderLoaded();
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() => expect(upsertMutate).toHaveBeenCalled());
		expect(upsertMutate.mock.calls[0]?.[0]).toEqual({
			year: 2027,
			decl1ModificationDeadline: "2027-06-01",
			decl1JointEvaluationDeadline: "2027-08-01",
			decl2ModificationDeadline: "2027-12-01",
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
				screen.getByText(/doit être postérieure à l'échéance de déclaration/i),
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
			).getByLabelText(/échéance pour le choix du parcours/i),
		).toHaveValue("");
		expect(screen.getByRole("button", { name: /enregistrer/i })).toBeDisabled();
		expect(screen.queryByText(/valeurs par défaut/i)).not.toBeInTheDocument();
	});

	it("blocks any submission and offers a retry when the initial load fails", async () => {
		queryState.data = undefined;
		queryState.isError = true;
		render(<RemunerationDeadlinesForm year={2027} />);

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

	it("shows a visible required-fields mention that every editable deadline cites", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		const mention = "Toutes les échéances modifiables sont obligatoires.";
		expect(screen.getByText(mention)).not.toHaveClass("fr-sr-only");

		const requiredInputs = Array.from(
			document.querySelectorAll<HTMLInputElement>("input[required]"),
		);
		expect(requiredInputs).toHaveLength(5);
		for (const input of requiredInputs) {
			expect(input).toHaveAccessibleDescription(mention);
		}
	});

	it("does not cite the mention on the read-only derived deadlines", () => {
		render(<RemunerationDeadlinesForm year={2027} />);
		for (const input of document.querySelectorAll("input[readonly]")) {
			expect(input).not.toBeRequired();
			expect(input).not.toHaveAttribute("aria-describedby");
		}
	});

	it("describes an invalid deadline by the mention then its error message", async () => {
		await renderLoaded();
		fireEvent.change(inputById("settings-decl2ModificationDeadline"), {
			target: { value: "2027-05-01" },
		});
		await userEvent.click(screen.getByRole("button", { name: /enregistrer/i }));
		await waitFor(() =>
			expect(
				inputById("settings-decl2ModificationDeadline"),
			).toHaveAccessibleDescription(
				/^Toutes les échéances modifiables sont obligatoires\. .*postérieure à l'échéance de déclaration/,
			),
		);
	});
});

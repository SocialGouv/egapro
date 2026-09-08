import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LockProvider } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { SecondDeclarationStep2Form } from "../SecondDeclarationStep2Form";

const { setFieldMock, clearDraftMock, mutateMock } = vi.hoisted(() => ({
	setFieldMock: vi.fn(),
	clearDraftMock: vi.fn(),
	mutateMock: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		declaration: {
			updateEmployeeCategories: {
				useMutation: () => ({
					mutate: mutateMock,
					isPending: false,
					error: null,
				}),
			},
		},
	},
}));

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({
		useDeclarationDraft: () => ({
			draft: {},
			setField: setFieldMock,
			clearDraft: clearDraftMock,
			isLoadingDraft: false,
		}),
	}),
);

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDraftHydration",
	() => ({
		useDraftHydration: () => true,
	}),
);

function makeCategory(
	overrides: Partial<EmployeeCategoryRow> = {},
): EmployeeCategoryRow {
	return {
		name: "",
		womenCount: null,
		menCount: null,
		hourlyWomenCount: null,
		hourlyMenCount: null,
		annualBaseWomen: null,
		annualBaseMen: null,
		annualVariableWomen: null,
		annualVariableMen: null,
		hourlyBaseWomen: null,
		hourlyBaseMen: null,
		hourlyVariableWomen: null,
		hourlyVariableMen: null,
		...overrides,
	};
}

const mockCategories: EmployeeCategoryRow[] = [
	makeCategory({
		name: "Ouvriers",
		womenCount: 50,
		menCount: 60,
		annualBaseWomen: "19114",
		annualBaseMen: "24383",
		annualVariableWomen: "2132",
		annualVariableMen: "1802",
		hourlyBaseWomen: "18.88",
		hourlyBaseMen: "16.73",
		hourlyVariableWomen: "1.04",
		hourlyVariableMen: "1.02",
	}),
];

function renderStep2(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep2Form>> = {},
) {
	return render(
		<LockProvider>
			<SecondDeclarationStep2Form
				declarationSiren="123456789"
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
				status="corrective_actions_chosen"
				{...overrides}
			/>
		</LockProvider>,
	);
}

function renderStep2ReadOnly(
	overrides: Partial<ComponentProps<typeof SecondDeclarationStep2Form>> = {},
) {
	return render(
		<LockProvider isReadOnly>
			<SecondDeclarationStep2Form
				declarationSiren="123456789"
				declarationYear={2025}
				initialFirstDeclarationCategories={mockCategories}
				status="corrective_actions_chosen"
				{...overrides}
			/>
		</LockProvider>,
	);
}

beforeEach(() => {
	setFieldMock.mockClear();
	clearDraftMock.mockClear();
	mutateMock.mockClear();
});

describe("SecondDeclarationStep2Form", () => {
	it("renders the title and step indicator", () => {
		renderStep2();
		expect(
			screen.getByText(
				/Parcours de mise en conformité pour l.indicateur par catégories de salariés/,
			),
		).toBeInTheDocument();
		expect(screen.getByText("Étape 2 sur 3")).toBeInTheDocument();
	});

	it("displays category label as read-only text", () => {
		renderStep2();
		// The category label is now carried by the accordion heading and the
		// table <caption> (RGAA 5.2) — no redundant read-only <p>, no editable input.
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Ouvriers",
			}),
		).toBeInTheDocument();
		expect(
			screen.queryByLabelText("Libellé de la catégorie d'emploi"),
		).not.toBeInTheDocument();
	});

	it("displays source as read-only text", () => {
		renderStep2({ initialSource: "accord-entreprise" });
		expect(
			screen.getByText(/Source utilisée pour déterminer/),
		).toBeInTheDocument();
		expect(screen.getByText("Accord d'entreprise")).toBeInTheDocument();
		expect(
			screen.queryByLabelText(/Quelle est la source/),
		).not.toBeInTheDocument();
	});

	it("places the source paragraph immediately after the intro paragraph (#4215)", () => {
		renderStep2({ initialSource: "accord-entreprise" });
		const introParagraph = screen.getByText(
			/Cette seconde déclaration reprend les catégories/,
		);
		const sourceParagraph = screen
			.getByText(/Source utilisée pour déterminer/)
			.closest("p");
		expect(introParagraph.nextElementSibling).toBe(sourceParagraph);
	});

	it("places the source paragraph before the obligatoires mention (#4215)", () => {
		renderStep2({ initialSource: "accord-entreprise" });
		const sourceParagraph = screen
			.getByText(/Source utilisée pour déterminer/)
			.closest("p") as HTMLElement;
		const obligatoiresParagraph = screen.getByText(
			"Tous les champs sont obligatoires.",
		);
		expect(sourceParagraph.nextElementSibling).toBe(obligatoiresParagraph);
	});

	it("keeps the source paragraph out of the reference period block (#4215)", () => {
		renderStep2({ initialSource: "accord-entreprise" });
		const startDateField = screen.getByLabelText(/Date de début/);
		const sourceParagraph = screen
			.getByText(/Source utilisée pour déterminer/)
			.closest("p") as HTMLElement;
		expect(
			startDateField.compareDocumentPosition(sourceParagraph) &
				Node.DOCUMENT_POSITION_PRECEDING,
		).toBeTruthy();
	});

	it("renders reference period date pickers", () => {
		renderStep2();
		expect(screen.getByLabelText(/Date de début/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Date de fin/)).toBeInTheDocument();
		expect(
			screen.queryByText(/Période de référence pour le calcul des indicateurs/),
		).not.toBeInTheDocument();
	});

	it("does not render add category button (read-only categories)", () => {
		renderStep2();
		expect(
			screen.queryByRole("button", { name: /Ajouter une catégorie/ }),
		).not.toBeInTheDocument();
	});

	it("renders previous link to step 1", () => {
		renderStep2();
		expect(screen.getByRole("link", { name: /précédent/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("uses second declaration data when available", () => {
		const secondDeclData: EmployeeCategoryRow[] = [
			makeCategory({
				name: "Techniciens",
				womenCount: 30,
				menCount: 40,
				annualBaseWomen: "25000",
				annualBaseMen: "26000",
				annualVariableWomen: "3000",
				annualVariableMen: "3200",
				hourlyBaseWomen: "20",
				hourlyBaseMen: "21",
				hourlyVariableWomen: "2",
				hourlyVariableMen: "2.5",
			}),
		];

		renderStep2({ initialSecondDeclarationCategories: secondDeclData });
		expect(
			screen.getByRole("button", {
				name: "Catégorie d'emplois n°1 : Techniciens",
			}),
		).toBeInTheDocument();
	});

	it("keeps Suivant as a submit button while the second declaration is writable", () => {
		renderStep2();
		expect(
			screen.getByRole("button", { name: /suivant/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("renders Suivant as a recap link when the second declaration is no longer writable", () => {
		renderStep2({ status: "revised_joint_evaluation_chosen" });
		expect(screen.getByRole("link", { name: /suivant/i })).toHaveAttribute(
			"href",
			"/declaration-remuneration/parcours-conformite/etape/3",
		);
		expect(
			screen.queryByRole("button", { name: /suivant/i }),
		).not.toBeInTheDocument();
	});

	it("disables the reference period pickers when the second declaration is no longer writable", () => {
		renderStep2({ status: "revised_joint_evaluation_chosen" });
		expect(screen.getByLabelText(/Date de début/)).toBeDisabled();
		expect(screen.getByLabelText(/Date de fin/)).toBeDisabled();
	});

	it("renders the lock-protected inputs as readOnly instead of disabled", () => {
		renderStep2ReadOnly();

		const startDate = screen.getByLabelText(/Date de début/);
		const womenCount = screen.getByLabelText(
			/Rémunération annuelle — Nombre de femmes, catégorie 1/,
		);

		expect(startDate).toHaveAttribute("readonly");
		expect(startDate).not.toBeDisabled();
		expect(womenCount).toHaveAttribute("readonly");
		expect(womenCount).not.toBeDisabled();
	});

	it("does not autosave the draft when the declaration is lock-read-only", () => {
		renderStep2ReadOnly();
		expect(setFieldMock).not.toHaveBeenCalled();
	});
});

describe("SecondDeclarationStep2Form — headcount per pay basis (#4254)", () => {
	it("shows both headcount rows without the first-declaration reminder", () => {
		renderStep2();

		expect(
			screen.getByRole("rowheader", { name: "Rémunération annuelle" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("rowheader", { name: "Rémunération horaire" }),
		).toBeInTheDocument();
		expect(
			screen.queryByText(/Pour rappel, le nombre total de salariés/),
		).not.toBeInTheDocument();
	});

	it("prefills each basis from the first declaration's categories", () => {
		renderStep2({
			initialFirstDeclarationCategories: [
				{
					...(mockCategories[0] as EmployeeCategoryRow),
					name: "Cadres",
					womenCount: 3,
					menCount: 4,
					hourlyWomenCount: 1,
					hourlyMenCount: 2,
				},
			],
		});

		expect(
			screen.getByLabelText(
				"Rémunération annuelle — Nombre de femmes, catégorie 1",
			),
		).toHaveValue("3");
		expect(
			screen.getByLabelText(
				"Rémunération horaire — Nombre de femmes, catégorie 1",
			),
		).toHaveValue("1");
		expect(
			screen.getByLabelText(
				"Rémunération horaire — Nombre d'hommes, catégorie 1",
			),
		).toHaveValue("2");
	});
});

describe("SecondDeclarationStep2Form — non-calculable category (#3678)", () => {
	const payValues = {
		annualBaseWomen: "30000",
		annualBaseMen: "32000",
		annualVariableWomen: "5000",
		annualVariableMen: "6000",
		hourlyBaseWomen: "18",
		hourlyBaseMen: "19",
		hourlyVariableWomen: "3",
		hourlyVariableMen: "4",
	} as const;

	it("restores hidden pay while the correction form remains mounted", async () => {
		const user = userEvent.setup();
		renderStep2({
			initialFirstDeclarationCategories: [
				makeCategory({
					name: "Cadres",
					womenCount: 3,
					menCount: 2,
					hourlyWomenCount: 3,
					hourlyMenCount: 2,
					...payValues,
				}),
			],
		});
		const menCount = screen.getByLabelText(
			"Rémunération annuelle — Nombre d'hommes, catégorie 1",
		);

		await user.clear(menCount);
		await user.type(menCount, "0");
		expect(screen.getByText("Écart non calculable")).toBeInTheDocument();
		expect(
			screen.queryByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).not.toBeInTheDocument();

		await user.clear(menCount);
		await user.type(menCount, "2");
		expect(
			screen.getByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).toHaveValue("30 000,00");
		expect(
			screen.getByLabelText(
				"Composantes variables horaires hommes, catégorie 1",
			),
		).toHaveValue("4,00");
	});

	it("omits hidden pay when the correction is submitted", async () => {
		const user = userEvent.setup();
		renderStep2({
			initialFirstDeclarationCategories: [
				makeCategory({
					name: "Cadres",
					womenCount: 3,
					menCount: 0,
					hourlyWomenCount: 3,
					hourlyMenCount: 2,
					...payValues,
				}),
			],
			initialSource: "accord-entreprise",
			initialStartDate: "2024-01-01",
			initialEndDate: "2024-12-31",
		});

		expect(screen.getByText("Écart non calculable")).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: /suivant/i }));

		expect(mutateMock).toHaveBeenCalledTimes(1);
		const data = mutateMock.mock.calls[0]?.[0]?.categories?.[0]?.data;
		expect(data).toMatchObject({ womenCount: 3, menCount: 0 });
		expect(data?.annualBaseWomen).toBeUndefined();
		expect(data?.hourlyVariableMen).toBeUndefined();
	});

	it("keeps pay absent after reload from a sanitized correction", () => {
		renderStep2({
			initialSecondDeclarationCategories: [
				makeCategory({
					name: "Cadres",
					womenCount: 3,
					menCount: 0,
					hourlyWomenCount: 3,
					hourlyMenCount: 2,
				}),
			],
		});

		expect(screen.getByText("Écart non calculable")).toBeInTheDocument();
		expect(
			screen.queryByLabelText("Salaire de base annuel femmes, catégorie 1"),
		).not.toBeInTheDocument();
	});
});

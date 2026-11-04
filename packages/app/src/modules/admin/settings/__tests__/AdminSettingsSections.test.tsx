import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

const { overviewState, lockMutate, remunerationMutate } = vi.hoisted(() => ({
	overviewState: { data: undefined } as {
		data: { configuredYears: number[] } | undefined;
	},
	lockMutate: vi.fn(),
	remunerationMutate: vi.fn(),
}));

vi.mock("~/trpc/react", () => ({
	api: {
		adminSettings: {
			getOverview: {
				useQuery: (
					_input: undefined,
					opts: { initialData: { configuredYears: number[] } },
				) => ({ data: overviewState.data ?? opts.initialData }),
			},
			updateLockTimeout: {
				useMutation: () => ({ mutate: lockMutate, isPending: false }),
			},
		},
		useUtils: () => ({
			adminSettings: { getLockTimeout: { invalidate: vi.fn() } },
		}),
	},
}));

vi.mock("../CommonCalendarForm", () => ({
	CommonCalendarForm: ({ year }: { year: number }) =>
		React.createElement("form", {
			"data-testid": "common-calendar-form",
			"data-year": year,
		}),
}));

vi.mock("../RemunerationDeadlinesForm", () => ({
	RemunerationDeadlinesForm: ({ year }: { year: number }) =>
		React.createElement(
			"form",
			{ "data-testid": "remuneration-deadlines-form", "data-year": year },
			React.createElement(
				"button",
				{ onClick: () => remunerationMutate(year), type: "button" },
				"Enregistrer les échéances",
			),
		),
}));

vi.mock("../RepresentationCampaignForm", () => ({
	RepresentationCampaignForm: ({ year }: { year: number }) =>
		React.createElement("form", {
			"data-testid": "representation-campaign-form",
			"data-year": year,
		}),
}));

import { AdminSettingsSections } from "../AdminSettingsSections";

function renderSections(
	overrides: Partial<React.ComponentProps<typeof AdminSettingsSections>> = {},
) {
	return render(
		<AdminSettingsSections
			configuredYears={[2026, 2027]}
			initialYear={2026}
			lockTimeoutMinutes={45}
			{...overrides}
		/>,
	);
}

const yearSelector = () =>
	screen.getByRole("combobox", { name: "Année de la campagne" });

const headingOutline = () =>
	screen
		.getAllByRole("heading")
		.map(
			(heading) => `h${heading.tagName.slice(1)} ${heading.textContent ?? ""}`,
		);

describe("AdminSettingsSections", () => {
	beforeEach(() => {
		overviewState.data = undefined;
		lockMutate.mockReset();
		remunerationMutate.mockReset();
	});

	it("renders a single year selector, preset on the initial year, labelled without any hint", () => {
		renderSections();
		expect(screen.getAllByRole("combobox")).toHaveLength(1);
		expect(yearSelector()).toHaveValue("2026");
		expect(yearSelector()).toHaveAccessibleName("Année de la campagne");
		expect(screen.queryByText(/portent sur l'année sélectionnée/i)).toBeNull();
	});

	it("orders common settings, then the remuneration démarche, then the representation démarche", () => {
		renderSections();
		expect(headingOutline()).toEqual([
			"h2 Paramètres communs",
			"h3 Calendrier de la campagne 2026",
			"h3 Verrou de connexion",
			"h2 Démarche Rémunération",
			"h3 Échéances de la campagne 2026",
			"h2 Démarche Représentation équilibrée",
			"h3 Échéances de la campagne 2026",
		]);
	});

	it("groups the common calendar then the lock timeout under the common settings", () => {
		renderSections();
		const common = screen
			.getByRole("heading", { level: 2, name: "Paramètres communs" })
			.closest("section") as HTMLElement;
		const forms = common.querySelectorAll("form");
		expect(forms).toHaveLength(2);
		expect(forms[0]).toBe(screen.getByTestId("common-calendar-form"));
		expect(forms[1]).toContainElement(
			screen.getByLabelText(/délai d'expiration du verrou/i),
		);
	});

	it("leaves the deadlines form as the only block of the remuneration démarche", () => {
		renderSections();
		const remuneration = screen
			.getByRole("heading", { level: 2, name: "Démarche Rémunération" })
			.closest("section") as HTMLElement;
		const forms = remuneration.querySelectorAll("form");
		expect(forms).toHaveLength(1);
		expect(forms[0]).toBe(screen.getByTestId("remuneration-deadlines-form"));
	});

	it("lists every year from FIRST_DECLARATION_YEAR to ten years ahead, flagging unconfigured ones", () => {
		renderSections();
		const options = Array.from(
			yearSelector().querySelectorAll("option"),
		) as HTMLOptionElement[];
		expect(options[0]?.value).toBe(String(FIRST_DECLARATION_YEAR));
		expect(options.at(-1)?.value).toBe(String(getCurrentYear() + 10));
		const labelFor = (year: number) =>
			options.find((option) => option.value === String(year))?.textContent;
		expect(labelFor(2026)).toBe("2026");
		expect(labelFor(2028)).toBe("2028 (non configurée)");
	});

	it("drops the 'non configurée' suffix once the overview reports the year as configured", () => {
		overviewState.data = { configuredYears: [2026, 2027, 2028] };
		renderSections();
		const option = Array.from(yearSelector().querySelectorAll("option")).find(
			(o) => o.value === "2028",
		);
		expect(option?.textContent).toBe("2028");
	});

	it("passes the selected year to the three annual blocks and their headings", async () => {
		renderSections();
		await userEvent.selectOptions(yearSelector(), "2027");

		expect(
			screen.getByTestId("common-calendar-form").getAttribute("data-year"),
		).toBe("2027");
		expect(
			screen
				.getByTestId("remuneration-deadlines-form")
				.getAttribute("data-year"),
		).toBe("2027");
		expect(
			screen
				.getByTestId("representation-campaign-form")
				.getAttribute("data-year"),
		).toBe("2027");
		expect(headingOutline().filter((h) => h.endsWith("2027"))).toHaveLength(3);
		expect(headingOutline()).toEqual(
			expect.arrayContaining([
				"h3 Calendrier de la campagne 2027",
				"h3 Échéances de la campagne 2027",
			]),
		);
	});

	it("places the lock timeout under the common settings, outside the calendar form", () => {
		renderSections();
		const lockInput = screen.getByLabelText(/délai d'expiration du verrou/i);
		const common = screen
			.getByRole("heading", { level: 2, name: "Paramètres communs" })
			.closest("section") as HTMLElement;
		const remuneration = screen
			.getByRole("heading", { level: 2, name: "Démarche Rémunération" })
			.closest("section") as HTMLElement;

		expect(common).toContainElement(lockInput);
		expect(remuneration).not.toContainElement(lockInput);
		expect(screen.getByTestId("common-calendar-form")).not.toContainElement(
			lockInput,
		);
	});

	it("keeps the lock timeout unchanged when another year is selected", async () => {
		renderSections({ initialYear: 2027 });
		expect(screen.getByLabelText(/délai d'expiration du verrou/i)).toHaveValue(
			45,
		);

		await userEvent.selectOptions(yearSelector(), "2028");

		expect(screen.getByLabelText(/délai d'expiration du verrou/i)).toHaveValue(
			45,
		);
	});

	it("saves the lock timeout on its own, without writing any deadline", async () => {
		renderSections({ initialYear: 2028 });
		fireEvent.change(screen.getByLabelText(/délai d'expiration du verrou/i), {
			target: { value: "60" },
		});
		const lockForm = screen
			.getByLabelText(/délai d'expiration du verrou/i)
			.closest("form") as HTMLFormElement;
		fireEvent.submit(lockForm);

		await waitFor(() =>
			expect(lockMutate).toHaveBeenCalledWith({ timeoutMinutes: 60 }),
		);
		expect(remunerationMutate).not.toHaveBeenCalled();
	});
});

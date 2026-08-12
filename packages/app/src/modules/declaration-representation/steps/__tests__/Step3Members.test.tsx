import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	COMPUTABLE_MEMBERS,
	REPRESENTATION_YEAR,
} from "~/modules/declaration-representation/__tests__/fixtures";
import { RepresentationDraftProvider } from "~/modules/declaration-representation/shared/draft/DraftContext";
import type { RepresentationDraft } from "~/modules/declaration-representation/types";
import {
	REPRESENTATION_TARGET_INITIAL,
	REPRESENTATION_TARGET_RAISED,
	REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR,
} from "~/modules/domain";
import { Step3Members } from "../Step3Members";

const STEP = 3;

const RAISED_TARGET_YEAR = REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR - 1;

const NON_COMPLIANT_MEMBERS = {
	hasManagementBody: true,
	memberWomenPercent: 75,
	memberMenPercent: 25,
} as const;

const BETWEEN_TARGETS_MEMBERS = {
	hasManagementBody: true,
	memberWomenPercent: 65,
	memberMenPercent: 35,
} as const;

const NON_COMPLIANT_EXECUTIVES = {
	executivesCount: "two_or_more",
	executiveWomenPercent: 75,
	executiveMenPercent: 25,
} as const;

type HarnessProps = {
	draft?: Partial<RepresentationDraft>;
	isReadOnly?: boolean;
	year?: number;
	onSetDraftValues?: (values: Partial<RepresentationDraft>) => void;
};

function Harness({
	draft: initialDraft = {},
	isReadOnly = false,
	year = REPRESENTATION_YEAR,
	onSetDraftValues,
}: HarnessProps) {
	const [draft, setDraft] = useState<RepresentationDraft>({
		currentStep: STEP,
		...initialDraft,
	});

	function setDraftValues(values: Partial<RepresentationDraft>) {
		onSetDraftValues?.(values);
		setDraft((previous) => ({ ...previous, ...values }));
	}

	return (
		<RepresentationDraftProvider
			value={{
				year,
				step: STEP,
				draft,
				setDraftValues,
				isSaving: false,
				isPendingSave: false,
				isReadOnly,
				setStepValid: vi.fn(),
			}}
		>
			<Step3Members />
		</RepresentationDraftProvider>
	);
}

function noneRadio() {
	return screen.getByRole("radio", { name: /Aucune instance dirigeante/ });
}

function someRadio() {
	return screen.getByRole("radio", {
		name: /Au moins une instance dirigeante/,
	});
}

function percentageFields() {
	return {
		women: screen.queryByLabelText(/Femmes/),
		men: screen.queryByLabelText(/Hommes/),
	};
}

function queryBadge() {
	return screen.queryByText(/^(Conforme|Non conforme|Non applicable)$/);
}

function spy() {
	return vi.fn<(values: Partial<RepresentationDraft>) => void>();
}

describe("Step3Members — existence d'instances dirigeantes (S8)", () => {
	it("n'affiche ni champ de pourcentage ni badge tant qu'aucun choix n'est fait", () => {
		render(<Harness />);

		expect(noneRadio()).not.toBeChecked();
		expect(someRadio()).not.toBeChecked();
		expect(percentageFields().women).not.toBeInTheDocument();
		expect(percentageFields().men).not.toBeInTheDocument();
		expect(queryBadge()).not.toBeInTheDocument();
	});

	it("révèle la paire de pourcentages quand au moins une instance dirigeante est déclarée", async () => {
		const setDraftValues = spy();
		render(<Harness onSetDraftValues={setDraftValues} />);

		await userEvent.click(someRadio());

		expect(setDraftValues).toHaveBeenCalledExactlyOnceWith({
			hasManagementBody: true,
		});
		expect(someRadio()).toBeChecked();
		expect(percentageFields().women).toHaveValue("");
		expect(percentageFields().men).toHaveValue("");
		expect(queryBadge()).not.toBeInTheDocument();
	});

	it("retire les champs et efface les pourcentages déjà saisis quand aucune instance n'est déclarée", async () => {
		const setDraftValues = spy();
		render(
			<Harness draft={COMPUTABLE_MEMBERS} onSetDraftValues={setDraftValues} />,
		);

		expect(percentageFields().women).toHaveValue(
			String(COMPUTABLE_MEMBERS.memberWomenPercent),
		);

		await userEvent.click(noneRadio());

		expect(setDraftValues).toHaveBeenCalledExactlyOnceWith({
			hasManagementBody: false,
			memberWomenPercent: undefined,
			memberMenPercent: undefined,
		});
		expect(noneRadio()).toBeChecked();
		expect(percentageFields().women).not.toBeInTheDocument();
		expect(queryBadge()).not.toBeInTheDocument();

		await userEvent.click(someRadio());

		expect(percentageFields().women).toHaveValue("");
		expect(percentageFields().men).toHaveValue("");
	});
});

describe("Step3Members — saisie des pourcentages", () => {
	it("répercute la saisie et son complément automatique dans le brouillon", async () => {
		const setDraftValues = spy();
		render(
			<Harness
				draft={{ hasManagementBody: true }}
				onSetDraftValues={setDraftValues}
			/>,
		);

		const women = screen.getByLabelText(/Femmes/);
		await userEvent.type(women, "45");

		expect(setDraftValues).toHaveBeenLastCalledWith({
			memberWomenPercent: 45,
			memberMenPercent: 55,
		});
		expect(women).toHaveValue("45");
		expect(screen.getByLabelText(/Hommes/)).toHaveValue("55");
	});

	it.each([
		["une virgule", "33,3"],
		["un point", "33.3"],
	])("enregistre un pourcentage à une décimale saisi avec %s", async (_separator, typed) => {
		const setDraftValues = spy();
		render(
			<Harness
				draft={{ hasManagementBody: true }}
				onSetDraftValues={setDraftValues}
			/>,
		);

		await userEvent.type(screen.getByLabelText(/Femmes/), typed);

		expect(setDraftValues).toHaveBeenLastCalledWith({
			memberWomenPercent: 33.3,
			memberMenPercent: 66.7,
		});
	});

	it("vide la valeur du brouillon et le verdict quand le champ est effacé", async () => {
		const setDraftValues = spy();
		render(
			<Harness draft={COMPUTABLE_MEMBERS} onSetDraftValues={setDraftValues} />,
		);

		expect(queryBadge()).toBeInTheDocument();

		await userEvent.clear(screen.getByLabelText(/Femmes/));

		expect(setDraftValues).toHaveBeenCalledExactlyOnceWith({
			memberWomenPercent: undefined,
			memberMenPercent: COMPUTABLE_MEMBERS.memberMenPercent,
		});
		expect(queryBadge()).not.toBeInTheDocument();
	});

	it("réaffiche les pourcentages décimaux d'un brouillon rechargé", () => {
		render(
			<Harness
				draft={{
					hasManagementBody: true,
					memberWomenPercent: 33.3,
					memberMenPercent: 66.7,
				}}
			/>,
		);

		expect(screen.getByLabelText(/Femmes/)).toHaveValue("33.3");
		expect(screen.getByLabelText(/Hommes/)).toHaveValue("66.7");
		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});
});

describe("Step3Members — verdict de conformité (S13–S15)", () => {
	it("présente l'indicateur comme conforme quand les deux sexes atteignent le seuil", () => {
		render(<Harness draft={COMPUTABLE_MEMBERS} />);

		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});

	it("présente l'indicateur comme non conforme quand le sexe sous-représenté est sous le seuil", () => {
		render(<Harness draft={NON_COMPLIANT_MEMBERS} />);

		expect(screen.getByText("Non conforme")).toBeInTheDocument();
	});

	it("applique le seuil relevé à partir de la campagne concernée", () => {
		const { rerender } = render(
			<Harness draft={BETWEEN_TARGETS_MEMBERS} year={REPRESENTATION_YEAR} />,
		);

		expect(BETWEEN_TARGETS_MEMBERS.memberMenPercent).toBeGreaterThanOrEqual(
			REPRESENTATION_TARGET_INITIAL,
		);
		expect(BETWEEN_TARGETS_MEMBERS.memberMenPercent).toBeLessThan(
			REPRESENTATION_TARGET_RAISED,
		);
		expect(screen.getByText("Conforme")).toBeInTheDocument();

		rerender(
			<Harness draft={BETWEEN_TARGETS_MEMBERS} year={RAISED_TARGET_YEAR} />,
		);

		expect(screen.getByText("Non conforme")).toBeInTheDocument();
	});

	it.each([
		["seul le pourcentage de femmes", { memberWomenPercent: 55 }],
		["seul le pourcentage d'hommes", { memberMenPercent: 45 }],
	])("n'affiche aucun badge quand %s est renseigné", (_label, percentages) => {
		render(<Harness draft={{ hasManagementBody: true, ...percentages }} />);

		expect(queryBadge()).not.toBeInTheDocument();
	});
});

describe("Step3Members — indépendance des verdicts (S16)", () => {
	it("reste conforme malgré des cadres dirigeants non conformes et ne touche que ses propres champs", async () => {
		const setDraftValues = spy();
		render(
			<Harness
				draft={{ ...NON_COMPLIANT_EXECUTIVES, ...COMPUTABLE_MEMBERS }}
				onSetDraftValues={setDraftValues}
			/>,
		);

		expect(screen.getByText("Conforme")).toBeInTheDocument();

		await userEvent.click(noneRadio());
		await userEvent.click(someRadio());
		await userEvent.type(screen.getByLabelText(/Femmes/), "45");

		const touchedKeys = [
			...new Set(
				setDraftValues.mock.calls.flatMap(([values]) => Object.keys(values)),
			),
		].sort();
		expect(touchedKeys).toEqual([
			"hasManagementBody",
			"memberMenPercent",
			"memberWomenPercent",
		]);
	});
});

describe("Step3Members — campagne close (S23)", () => {
	it("désactive les choix et verrouille les pourcentages", async () => {
		const setDraftValues = spy();
		render(
			<Harness
				draft={COMPUTABLE_MEMBERS}
				isReadOnly
				onSetDraftValues={setDraftValues}
			/>,
		);

		expect(noneRadio()).toBeDisabled();
		expect(someRadio()).toBeDisabled();

		const women = screen.getByLabelText(/Femmes/);
		expect(women).toHaveAttribute("readonly");
		expect(screen.getByLabelText(/Hommes/)).toHaveAttribute("readonly");

		await userEvent.click(noneRadio());
		await userEvent.type(women, "9");

		expect(setDraftValues).not.toHaveBeenCalled();
		expect(women).toHaveValue(String(COMPUTABLE_MEMBERS.memberWomenPercent));
		expect(screen.getByText("Conforme")).toBeInTheDocument();
	});
});

describe("Step3Members — repères réglementaires", () => {
	it("expose l'accordéon des définitions et rappelle les seuils de la loi", () => {
		render(<Harness />);

		const trigger = screen.getByRole("button", {
			name: /Définitions membres des instances dirigeantes et seuils réglementaires/,
		});
		const panelId = trigger.getAttribute("aria-controls") ?? "";

		expect(document.getElementById(panelId)).not.toBeNull();
		expect(
			screen.getByText(/article L\.23-12-1 du Code de commerce/),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				new RegExp(
					`${REPRESENTATION_TARGET_INITIAL} %.+${REPRESENTATION_TARGET_RAISED} %.+${REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR}`,
				),
			),
		).toBeInTheDocument();
	});
});

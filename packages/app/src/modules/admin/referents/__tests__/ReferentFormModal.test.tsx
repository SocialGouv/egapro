import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { ReferentFormModal } from "../ReferentFormModal";
import type { ReferentSearchRow } from "../types";

const REFERENT: ReferentSearchRow = {
	id: "00000000-0000-4000-8000-000000000001",
	region: "11",
	county: "75",
	name: "Jean Dupont",
	type: "email",
	value: "jean@gouv.fr",
	principal: false,
	substituteName: null,
	substituteEmail: null,
	createdAt: new Date("2026-01-01T00:00:00Z"),
};

function renderModal(mode: "create" | "edit" = "edit") {
	const onSubmit = vi.fn();
	const onClose = vi.fn();
	const modalRef = createRef<HTMLDialogElement>();
	render(
		<ReferentFormModal
			modalRef={modalRef}
			mode={mode}
			onClose={onClose}
			onSubmit={onSubmit}
			referent={mode === "edit" ? REFERENT : null}
		/>,
	);
	return { onSubmit, onClose, modalRef };
}

const button = (name: string) =>
	screen.getByRole("button", { name, hidden: true });

const nameInput = () =>
	screen.getByRole("textbox", { name: /^Nom(?! du)/, hidden: true });

const valueInput = () =>
	screen.getByRole("textbox", { name: /^Valeur/, hidden: true });

async function editAndReview() {
	const user = userEvent.setup();
	const view = renderModal();
	await waitFor(() => expect(nameInput()).toHaveValue("Jean Dupont"));
	await user.clear(nameInput());
	await user.type(nameInput(), "Marie Martin");
	await user.clear(valueInput());
	await user.type(valueInput(), "marie@gouv.fr");
	await waitFor(() =>
		expect(button("Vérifier les modifications")).toBeEnabled(),
	);
	await user.click(button("Vérifier les modifications"));
	await screen.findByRole("heading", {
		name: "Vérifier les modifications",
		hidden: true,
	});
	return { ...view, user };
}

describe("ReferentFormModal — edit", () => {
	it("reviews the changes instead of saving them immediately", async () => {
		const { onSubmit, onClose } = await editAndReview();

		expect(onSubmit).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				name: "Vérifier les modifications",
				hidden: true,
			}),
		).toHaveFocus();

		const table = screen.getByRole("table", {
			name: "Modifications à confirmer",
			hidden: true,
		});
		const headers = Array.from(table.querySelectorAll("thead th")).map(
			(header) => header.textContent,
		);
		expect(headers).toEqual([
			"Information",
			"Valeur actuelle",
			"Nouvelle valeur",
		]);
		const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
			Array.from(row.children).map((cell) => cell.textContent),
		);
		expect(rows).toEqual([
			["Nom", "Jean Dupont", "Marie Martin"],
			["Valeur", "jean@gouv.fr", "marie@gouv.fr"],
		]);
		expect(table.querySelector("tbody th")).toHaveAttribute("scope", "row");
	});

	it("saves the edited referent only once the changes are confirmed", async () => {
		const { onSubmit, onClose, user } = await editAndReview();

		await user.click(button("Confirmer et enregistrer"));

		expect(onSubmit).toHaveBeenCalledOnce();
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				id: REFERENT.id,
				name: "Marie Martin",
				value: "marie@gouv.fr",
			}),
		);
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("goes back to the fields with the typed values kept and focuses the title", async () => {
		const { onSubmit, user } = await editAndReview();

		await user.click(button("Revenir aux champs"));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", {
				name: "Modifier le référent",
				hidden: true,
			}),
		).toHaveFocus();
		expect(nameInput()).toHaveValue("Marie Martin");
		expect(
			screen.queryByRole("button", {
				name: "Confirmer et enregistrer",
				hidden: true,
			}),
		).toBeNull();
	});

	it("cancels from the review without saving", async () => {
		const { onSubmit, onClose, user, modalRef } = await editAndReview();

		await user.click(button("Annuler"));
		act(() => modalRef.current?.dispatchEvent(new Event("dsfr.conceal")));

		expect(onClose).toHaveBeenCalledOnce();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("heading", {
				name: "Vérifier les modifications",
				hidden: true,
			}),
		).toBeNull();
		expect(button("Vérifier les modifications")).toBeInTheDocument();
	});

	it("offers no confirmation when nothing was changed", async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderModal();
		await waitFor(() => expect(nameInput()).toHaveValue("Jean Dupont"));
		await user.click(nameInput());
		await user.keyboard("{End} {Backspace}");
		await waitFor(() =>
			expect(button("Vérifier les modifications")).toBeEnabled(),
		);

		await user.click(button("Vérifier les modifications"));

		expect(
			await screen.findByText(
				"Vous n'avez modifié aucune information : il n'y a rien à enregistrer.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Confirmer et enregistrer",
				hidden: true,
			}),
		).toBeNull();
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

describe("ReferentFormModal — create", () => {
	it("keeps the direct save, since no stored data is replaced", () => {
		renderModal("create");
		expect(button("Sauvegarder")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "Vérifier les modifications",
				hidden: true,
			}),
		).toBeNull();
	});
});

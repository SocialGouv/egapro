import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyEmailButton } from "../CopyEmailButton";

const EMAIL = "index@travail.gouv.fr";
const writeText = vi.fn();

beforeEach(() => {
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText },
		writable: true,
		configurable: true,
	});
});

afterEach(() => {
	writeText.mockReset();
	Object.defineProperty(navigator, "clipboard", {
		value: undefined,
		configurable: true,
	});
});

function expectNameStartsWithVisibleLabel(button: HTMLElement) {
	const visibleLabel = button.textContent ?? "";
	expect(visibleLabel).not.toBe("");
	expect(button.getAttribute("aria-label")?.startsWith(visibleLabel)).toBe(
		true,
	);
}

describe("CopyEmailButton", () => {
	it("starts its accessible name with the visible label in the idle state", () => {
		render(<CopyEmailButton email={EMAIL} />);

		const button = screen.getByRole("button", {
			name: `Copier l'adresse ${EMAIL}`,
		});
		expect(button).toHaveTextContent("Copier");
		expectNameStartsWithVisibleLabel(button);
	});

	it("starts its accessible name with the visible label once the copy succeeds", async () => {
		writeText.mockResolvedValueOnce(undefined);
		render(<CopyEmailButton email={EMAIL} />);

		fireEvent.click(screen.getByRole("button"));

		const button = await screen.findByRole("button", {
			name: "Copié ! L'adresse est dans le presse-papier",
		});
		expect(writeText).toHaveBeenCalledWith(EMAIL);
		expect(button).toHaveTextContent("Copié !");
		expectNameStartsWithVisibleLabel(button);
	});

	it("starts its accessible name with the visible label when the copy fails", async () => {
		writeText.mockRejectedValueOnce(new Error("Not allowed"));
		render(<CopyEmailButton email={EMAIL} />);

		fireEvent.click(screen.getByRole("button"));

		const button = await screen.findByRole("button", {
			name: "Échec de la copie, copiez l'adresse manuellement",
		});
		expect(button).toHaveTextContent("Échec de la copie");
		expectNameStartsWithVisibleLabel(button);
	});
});

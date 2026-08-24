import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The DSFR runtime is absent in jsdom: the <dialog> stays closed, so its content sits outside the accessibility tree.
export function modalButton(name: string) {
	return screen.getByRole("button", { hidden: true, name });
}

export function queryModalCheckbox() {
	return screen.queryByRole("checkbox", { hidden: true });
}

export async function certifyModal() {
	const checkbox = queryModalCheckbox();
	if (checkbox === null) throw new Error("Missing certification checkbox.");
	await userEvent.click(checkbox);
}

export function modalLiveRegion(container: HTMLElement) {
	return container.querySelector('[aria-live="polite"]');
}

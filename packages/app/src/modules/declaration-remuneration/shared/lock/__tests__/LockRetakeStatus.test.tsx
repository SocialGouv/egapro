import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LockRetakeStatus } from "../LockRetakeStatus";
import type { LockHolderDisplay, LockRetake, RetakeStatus } from "../types";

const HOLDER: LockHolderDisplay = {
	firstName: "Bruno",
	lastName: "Petit",
	email: "bruno.petit@example.fr",
	lockTimeoutMinutes: 30,
};

function buildRetake(
	status: RetakeStatus,
	isAvailable: boolean,
	retake: () => void = vi.fn(),
): LockRetake {
	return { status, isAvailable, retake };
}

function renderStatus(retake: LockRetake | undefined, holder = HOLDER) {
	return render(
		<main id="content" tabIndex={-1}>
			<LockRetakeStatus holder={holder} retake={retake} />
		</main>,
	);
}

describe("LockRetakeStatus", () => {
	it("keeps an empty status region mounted while nothing has changed", () => {
		renderStatus(buildRetake("idle", false));

		expect(screen.getByRole("status")).toBeEmptyDOMElement();
	});

	it("keeps an empty status region for a page without a dynamic lock", () => {
		renderStatus(undefined);

		expect(screen.getByRole("status")).toBeEmptyDOMElement();
	});

	it("offers to edit once the declaration is released", () => {
		const retake = vi.fn();
		renderStatus(buildRetake("idle", true, retake));

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent(
			"La déclaration n'est plus en cours de modification.",
		);
		expect(status.querySelector(".fr-alert")).toHaveClass(
			"fr-alert--info",
			"fr-alert--sm",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Modifier la déclaration" }),
		);
		expect(retake).toHaveBeenCalledTimes(1);
	});

	it("keeps the released block in place while the retake is pending", () => {
		renderStatus(buildRetake("pending", false));

		expect(
			screen.getByRole("button", { name: "Modifier la déclaration" }),
		).toBeInTheDocument();
	});

	it("names the faster session and offers no button when outpaced", () => {
		renderStatus(buildRetake("outpaced", false));

		expect(screen.getByRole("status")).toHaveTextContent(
			"Bruno Petit (bruno.petit@example.fr) a commencé à modifier la déclaration avant vous. Vous restez en lecture seule.",
		);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("falls back to a generic label when the faster session is unknown", () => {
		renderStatus(buildRetake("outpaced", false), {
			...HOLDER,
			firstName: null,
			lastName: null,
			email: null,
		});

		expect(screen.getByRole("status")).toHaveTextContent(
			"Un autre utilisateur a commencé à modifier la déclaration avant vous.",
		);
	});

	it("invites to retry after a failure while the declaration is still free", () => {
		renderStatus(buildRetake("failed", true));

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent(
			"La reprise de la modification n'a pas abouti. Réessayez.",
		);
		expect(status.querySelector(".fr-alert")).toHaveClass("fr-alert--error");
		expect(
			screen.getByRole("button", { name: "Modifier la déclaration" }),
		).toBeInTheDocument();
	});

	it("drops the retry button after a failure once the declaration is taken", () => {
		renderStatus(buildRetake("failed", false));

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("confirms the retake and moves focus to the page content", () => {
		renderStatus(buildRetake("succeeded", false));

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent(
			"Vous pouvez maintenant modifier la déclaration.",
		);
		expect(status.querySelector(".fr-alert")).toHaveClass("fr-alert--success");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(document.getElementById("content"));
	});

	it("does not move focus when the declaration merely becomes available", () => {
		renderStatus(buildRetake("idle", true));

		expect(document.activeElement).toBe(document.body);
	});

	it("leaves the region content untouched when a poll repeats the same state", () => {
		const { rerender } = renderStatus(buildRetake("idle", true));
		const before = screen.getByRole("status").innerHTML;

		rerender(
			<main id="content" tabIndex={-1}>
				<LockRetakeStatus holder={HOLDER} retake={buildRetake("idle", true)} />
			</main>,
		);

		expect(screen.getByRole("status").innerHTML).toBe(before);
	});
});

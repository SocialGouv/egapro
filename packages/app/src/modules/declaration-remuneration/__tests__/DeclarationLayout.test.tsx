import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeclarationLayout } from "../DeclarationLayout";
import { useLockContext } from "../shared/lock/LockContext";

const company = {
	name: "Alpha Solutions",
	siren: "123456789",
	nafCode: "62.01Z",
	nafLabel: "Programmation informatique",
	workforce: 256,
	hasCse: true,
};

const lockHolder = {
	firstName: "Camille",
	lastName: "Martin",
	email: "camille.martin@example.fr",
};

function LockProbe() {
	const { isReadOnly, holder } = useLockContext();
	return (
		<span data-testid="lock-probe">{`${isReadOnly}:${holder?.email ?? "none"}`}</span>
	);
}

describe("DeclarationLayout", () => {
	it("renders the children inside the banner layout", () => {
		render(
			<DeclarationLayout company={company} declarationYear={2024}>
				<p>Step content</p>
			</DeclarationLayout>,
		);

		expect(screen.getByText("Step content")).toBeInTheDocument();
	});

	it("shows the lock alert when read-only and a holder is provided", () => {
		render(
			<DeclarationLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={lockHolder}
			>
				<p>Step content</p>
			</DeclarationLayout>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Déclaration en cours de modification",
		);
		expect(
			screen.getByText(/Camille Martin \(camille\.martin@example\.fr\)/),
		).toBeInTheDocument();
	});

	it("does not show the lock alert by default", () => {
		render(
			<DeclarationLayout company={company} declarationYear={2024}>
				<p>Step content</p>
			</DeclarationLayout>,
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("does not show the lock alert when read-only but no holder is resolved", () => {
		render(
			<DeclarationLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={null}
			>
				<p>Step content</p>
			</DeclarationLayout>,
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("provides the lock state to descendant consumers", () => {
		render(
			<DeclarationLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={lockHolder}
			>
				<LockProbe />
			</DeclarationLayout>,
		);

		expect(screen.getByTestId("lock-probe")).toHaveTextContent(
			"true:camille.martin@example.fr",
		);
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { GIP_WORKFORCE_ABSENT_DISPLAY } from "~/modules/domain";
import { CseOpinionLayout } from "../CseOpinionLayout";

const company = {
	name: "Alpha Solutions",
	siren: "123456789",
	gipWorkforce: 256,
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

describe("CseOpinionLayout", () => {
	it("renders the children inside the banner layout", () => {
		render(
			<CseOpinionLayout company={company} declarationYear={2024}>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.getByText("Step content")).toBeInTheDocument();
	});

	it("shows the lock alert when read-only and a holder is provided", () => {
		render(
			<CseOpinionLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={lockHolder}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
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
			<CseOpinionLayout company={company} declarationYear={2024}>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("does not show the lock alert when read-only but no holder is resolved", () => {
		render(
			<CseOpinionLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={null}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("provides the lock state to descendant consumers when read-only", () => {
		render(
			<CseOpinionLayout
				company={company}
				declarationYear={2024}
				isReadOnly
				lockHolder={lockHolder}
			>
				<LockProbe />
			</CseOpinionLayout>,
		);

		expect(screen.getByTestId("lock-probe")).toHaveTextContent(
			"true:camille.martin@example.fr",
		);
	});

	it("provides a non-readonly lock state to descendants by default", () => {
		render(
			<CseOpinionLayout company={company} declarationYear={2024}>
				<LockProbe />
			</CseOpinionLayout>,
		);

		expect(screen.getByTestId("lock-probe")).toHaveTextContent("false:none");
	});

	it("renders 'Non' when the company has no CSE", () => {
		render(
			<CseOpinionLayout
				company={{ ...company, hasCse: false }}
				declarationYear={2024}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.getByText("Non")).toBeInTheDocument();
	});

	it("renders 'Non renseigné' when the CSE existence is unknown", () => {
		render(
			<CseOpinionLayout
				company={{ ...company, hasCse: null }}
				declarationYear={2024}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.getByText("Non renseigné")).toBeInTheDocument();
	});

	it("shows the GIP unknown label and hides the CSE line when gipWorkforce is null", () => {
		const { container } = render(
			<CseOpinionLayout
				company={{ ...company, gipWorkforce: null }}
				declarationYear={2024}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(container.textContent).toContain(GIP_WORKFORCE_ABSENT_DISPLAY);
		expect(container.textContent).not.toContain("Existence d'un CSE :");
	});

	it("shows the workforce value and the CSE line when gipWorkforce is 250", () => {
		const { container } = render(
			<CseOpinionLayout
				company={{ ...company, gipWorkforce: 250 }}
				declarationYear={2024}
			>
				<p>Step content</p>
			</CseOpinionLayout>,
		);

		expect(screen.getByText("250")).toBeInTheDocument();
		expect(container.textContent).toContain("Existence d'un CSE :");
	});
});

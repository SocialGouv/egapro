import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	LOCK_HELD,
	LOCKED_BY_OTHER,
	lockWrapper,
} from "~/modules/declaration-representation/__tests__/representationLockHarness";
import { RepresentationLockNotice } from "../RepresentationLockNotice";

describe("RepresentationLockNotice", () => {
	it("announces the timeout and the automatic switch to editing when another person holds the lock", () => {
		render(<RepresentationLockNotice />, {
			wrapper: lockWrapper(LOCKED_BY_OTHER),
		});

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Camille Martin");
		expect(alert).toHaveTextContent("au plus tard 30 minutes");
		expect(alert).toHaveTextContent(
			"Cette page vérifie automatiquement si la déclaration se libère et passera alors en modification.",
		);
	});

	it("renders nothing while the lock is held", () => {
		render(<RepresentationLockNotice />, { wrapper: lockWrapper(LOCK_HELD) });

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

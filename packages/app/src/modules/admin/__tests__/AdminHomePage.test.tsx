import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminHomePage } from "../AdminHomePage";
import { summarizeServiceStatus, unreachableSummary } from "../serviceStatus";

describe("AdminHomePage", () => {
	it("displays the admin welcome message with the user name and email", () => {
		render(
			<AdminHomePage
				serviceStatus={summarizeServiceStatus([], [])}
				userEmail="[EMAIL_REDACTED]"
				userName="Alice"
			/>,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "Backoffice" }),
		).toBeInTheDocument();
		expect(screen.getByText("Bienvenue, Alice.")).toBeInTheDocument();
		expect(screen.getByText("[EMAIL_REDACTED]")).toBeInTheDocument();
	});

	it("shows the supervision banner when something is wrong", () => {
		render(
			<AdminHomePage
				serviceStatus={unreachableSummary()}
				userEmail="[EMAIL_REDACTED]"
				userName="Alice"
			/>,
		);

		expect(
			screen.getByText("La supervision ne répond plus"),
		).toBeInTheDocument();
	});
});

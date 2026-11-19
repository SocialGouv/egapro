import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ADMIN_SERVICE_STATUS } from "~/modules/routes";

import { ServiceStatusBanner } from "../ServiceStatusBanner";
import {
	summarizeServiceStatus,
	unreachableSummary,
} from "../shared/statusLabels";
import { serviceProbe } from "./fixtures";

describe("ServiceStatusBanner", () => {
	it("renders nothing when every service is operational", () => {
		const { container } = render(
			<ServiceStatusBanner
				summary={summarizeServiceStatus([serviceProbe()], [])}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("links to the status screen when a critical service is down", () => {
		render(
			<ServiceStatusBanner
				summary={summarizeServiceStatus(
					[serviceProbe({ status: "unavailable" })],
					[],
				)}
			/>,
		);

		expect(
			screen.getByText("1 service critique est indisponible"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Consulter l'état des services" }),
		).toHaveAttribute("href", ADMIN_SERVICE_STATUS);
	});

	it("warns when the supervision itself stopped answering", () => {
		render(<ServiceStatusBanner summary={unreachableSummary()} />);

		expect(
			screen.getByText("La supervision ne répond plus"),
		).toBeInTheDocument();
	});
});

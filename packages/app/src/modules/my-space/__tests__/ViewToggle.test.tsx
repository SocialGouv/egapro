import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ViewToggle } from "../ViewToggle";

const listContent = <div data-testid="list-view">Liste content</div>;
const tableContent = <div data-testid="table-view">Tableau content</div>;

describe("ViewToggle", () => {
	it("renders the company count with plural", () => {
		render(
			<ViewToggle
				companyCount={6}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		expect(screen.getByText("6 entreprises")).toBeInTheDocument();
	});

	it("renders the company count with singular for 1", () => {
		render(
			<ViewToggle
				companyCount={1}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		expect(screen.getByText("1 entreprise")).toBeInTheDocument();
	});

	it("renders the segmented control with Liste and Tableau options", () => {
		render(
			<ViewToggle
				companyCount={3}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		expect(screen.getByLabelText("Liste")).toBeInTheDocument();
		expect(screen.getByLabelText("Tableau")).toBeInTheDocument();
	});

	it("selects Liste by default", () => {
		render(
			<ViewToggle
				companyCount={3}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		expect(screen.getByLabelText("Liste")).toBeChecked();
		expect(screen.getByLabelText("Tableau")).not.toBeChecked();
	});

	it("shows list view by default", () => {
		render(
			<ViewToggle
				companyCount={3}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		expect(screen.getByTestId("list-view")).toBeInTheDocument();
		expect(screen.queryByTestId("table-view")).not.toBeInTheDocument();
	});

	it("switches to table view when Tableau is selected", () => {
		render(
			<ViewToggle
				companyCount={3}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Tableau"));
		expect(screen.queryByTestId("list-view")).not.toBeInTheDocument();
		expect(screen.getByTestId("table-view")).toBeInTheDocument();
	});

	it("switches back to list view when Liste is selected", () => {
		render(
			<ViewToggle
				companyCount={3}
				listView={listContent}
				tableView={tableContent}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Tableau"));
		fireEvent.click(screen.getByLabelText("Liste"));
		expect(screen.getByTestId("list-view")).toBeInTheDocument();
		expect(screen.queryByTestId("table-view")).not.toBeInTheDocument();
	});
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

vi.mock("@react-pdf/renderer", async () => {
	const React = await import("react");
	return {
		Text: ({ children }: { children: React.ReactNode }) =>
			React.createElement("span", null, children),
		View: ({ children }: { children: React.ReactNode }) =>
			React.createElement("div", null, children),
		StyleSheet: { create: <T,>(styles: T) => styles },
	};
});

import { GapCell } from "../GapCell";

const BADGE = "ÉLEVÉ";

describe("GapCell", () => {
	it("badges a positive gap at or above the 5% threshold", () => {
		render(<GapCell gap={7.17} />);
		expect(screen.getByText(BADGE)).toBeInTheDocument();
		expect(screen.getByText("7,2 %")).toBeInTheDocument();
	});

	it("does not badge a positive gap below the threshold", () => {
		render(<GapCell gap={4.6} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("4,6 %")).toBeInTheDocument();
	});

	it("badges a negative gap whose magnitude reaches the threshold", () => {
		render(<GapCell gap={-5.9} />);
		expect(screen.getByText(BADGE)).toBeInTheDocument();
		expect(screen.getByText("-5,9 %")).toBeInTheDocument();
	});

	it("does not badge a negative gap below the threshold in magnitude", () => {
		render(<GapCell gap={-4.3} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("-4,3 %")).toBeInTheDocument();
	});

	it("badges exactly at the threshold boundary", () => {
		render(<GapCell gap={5} />);
		expect(screen.getByText(BADGE)).toBeInTheDocument();
	});

	it("renders the null placeholder without a badge", () => {
		render(<GapCell gap={null} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("- %")).toBeInTheDocument();
	});

	it("never renders a 'faible' badge", () => {
		render(<GapCell gap={2} />);
		expect(screen.queryByText(/faible/i)).not.toBeInTheDocument();
	});
});

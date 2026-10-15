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
		expect(screen.getByText("7,17 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
	});

	it("does not badge a positive gap below the threshold", () => {
		render(<GapCell gap={4.6} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("4,60 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
	});

	it("badges a negative gap whose magnitude reaches the threshold", () => {
		render(<GapCell gap={-5.9} />);
		expect(screen.getByText(BADGE)).toBeInTheDocument();
		expect(screen.getByText("5,90 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
	});

	it("does not badge a negative gap below the threshold in magnitude", () => {
		render(<GapCell gap={-4.3} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("4,30 %")).toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
	});

	it("badges exactly at the threshold boundary", () => {
		render(<GapCell gap={5} />);
		expect(screen.getByText(BADGE)).toBeInTheDocument();
	});

	it("renders the null placeholder without a badge", () => {
		render(<GapCell gap={null} />);
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("- %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
	});

	it("renders zero without a favored sex", () => {
		render(<GapCell gap={0} />);
		expect(screen.getByText("0,00 %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
	});

	it("does not announce a direction for a gap displayed as zero", () => {
		render(<GapCell gap={-0.004} />);
		expect(screen.getByText("0,00 %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
	});

	it("never renders a 'faible' badge", () => {
		render(<GapCell gap={2} />);
		expect(screen.queryByText(/faible/i)).not.toBeInTheDocument();
	});
});

describe("GapCell — favoredSex variant", () => {
	it("prints the magnitude, the badge and the favored sex for a high gap favoring men", () => {
		render(<GapCell gap={7.17} variant="favoredSex" />);
		expect(screen.getByText("7,17 %")).toBeInTheDocument();
		expect(screen.getByText(BADGE)).toBeInTheDocument();
		expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
	});

	it("drops the sign of a gap favoring women and does not badge it below the threshold", () => {
		render(<GapCell gap={-3.168} variant="favoredSex" />);
		expect(screen.getByText("3,16 %")).toBeInTheDocument();
		expect(screen.queryByText("-3,16 %")).not.toBeInTheDocument();
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
		expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
	});

	it("prints no favored sex for a gap that displays as zero", () => {
		render(<GapCell gap={0.001} variant="favoredSex" />);
		expect(screen.getByText("0,00 %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
	});

	it("prints the placeholder and no favored sex for a missing gap", () => {
		render(<GapCell gap={null} variant="favoredSex" />);
		expect(screen.getByText("- %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
		expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
	});

	it("keeps the signed rendering when explicitly requested", () => {
		render(<GapCell gap={-3.168} variant="signed" />);
		expect(screen.getByText("-3,16 %")).toBeInTheDocument();
		expect(screen.queryByText(/en faveur des/)).not.toBeInTheDocument();
	});
});

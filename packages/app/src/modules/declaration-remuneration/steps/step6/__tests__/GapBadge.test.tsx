import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GapBadge } from "../GapBadge";

describe("GapBadge", () => {
	it("shows the placeholder for a null gap regardless of layout", () => {
		render(<GapBadge gap={null} />);
		expect(screen.getByText("-")).toBeInTheDocument();
	});

	describe("inline layout (default) — signed, no mention", () => {
		it("shows the signed value without a badge below the threshold", () => {
			render(<GapBadge gap={-3} />);

			expect(screen.getByText("-3,00 %")).toBeInTheDocument();
			expect(screen.queryByText("élevé")).not.toBeInTheDocument();
			expect(screen.queryByText(/en faveur/)).not.toBeInTheDocument();
		});

		it("shows the signed value with the high badge, never a favored-sex mention", () => {
			render(<GapBadge gap={-6} />);

			expect(screen.getByText("-6,00 %")).toBeInTheDocument();
			expect(screen.getByText("élevé")).toBeInTheDocument();
			expect(screen.queryByText(/en faveur/)).not.toBeInTheDocument();
		});
	});

	describe("cell layout — absolute value, badge, favored-sex mention", () => {
		it("shows the absolute value and the men mention for a low gap favoring men", () => {
			render(<GapBadge gap={3} layout="cell" />);

			expect(screen.getByText("3,00 %")).toBeInTheDocument();
			expect(screen.queryByText("-3,00 %")).not.toBeInTheDocument();
			expect(screen.queryByText("élevé")).not.toBeInTheDocument();
			expect(screen.getByText("en faveur des hommes")).toBeInTheDocument();
		});

		it("shows the absolute value, the high badge, and the women mention for a high gap favoring women", () => {
			render(<GapBadge gap={-6} layout="cell" />);

			expect(screen.getByText("6,00 %")).toBeInTheDocument();
			expect(screen.queryByText("-6,00 %")).not.toBeInTheDocument();
			expect(screen.getByText("élevé")).toBeInTheDocument();
			expect(screen.getByText("en faveur des femmes")).toBeInTheDocument();
		});

		it("shows no mention once the gap truncates to zero", () => {
			render(<GapBadge gap={0.004} layout="cell" />);

			expect(screen.getByText("0,00 %")).toBeInTheDocument();
			expect(screen.queryByText(/en faveur/)).not.toBeInTheDocument();
		});
	});
});

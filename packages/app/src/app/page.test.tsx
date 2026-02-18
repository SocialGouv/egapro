import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

// vi.mock is hoisted before imports — mocks the server-only tRPC module
vi.mock("~/trpc/server", () => ({
	HydrateClient: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("server-only", () => ({}));

describe("Home page", () => {
	it("renders hello world", async () => {
		const page = await Home();
		render(page);
		expect(screen.getByText("hello world")).toBeInTheDocument();
	});
});

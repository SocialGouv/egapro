import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next-auth/react", () => ({
	useSession: () => useSessionMock(),
	signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
	}),
	usePathname: vi.fn(),
}));

import { ImpersonateBanner } from "../ImpersonateBanner";

describe("ImpersonateBanner", () => {
	beforeEach(() => {
		useSessionMock.mockReset();
		refreshMock.mockReset();
	});

	it("renders nothing when not impersonating", () => {
		useSessionMock.mockReturnValue({ data: { user: { impersonation: null } } });
		const { container } = render(<ImpersonateBanner />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when session data is undefined", () => {
		useSessionMock.mockReturnValue({ data: undefined });
		const { container } = render(<ImpersonateBanner />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders the banner with company info when impersonating", () => {
		useSessionMock.mockReturnValue({
			data: {
				user: { impersonation: { siren: "123456789", name: "ACME" } },
			},
			update: vi.fn(),
		});
		render(<ImpersonateBanner />);
		expect(screen.getByText(/ACME/)).toBeInTheDocument();
		expect(screen.getByText(/123456789/)).toBeInTheDocument();
	});

	it("calls session.update(null) and router.refresh on stop click", async () => {
		const updateMock = vi.fn().mockResolvedValue(undefined);
		useSessionMock.mockReturnValue({
			data: {
				user: { impersonation: { siren: "123456789", name: "ACME" } },
			},
			update: updateMock,
		});
		render(<ImpersonateBanner />);
		await userEvent.click(
			screen.getByRole("button", { name: /arrêter le mimoquage/i }),
		);
		expect(updateMock).toHaveBeenCalledWith({ impersonation: null });
		expect(refreshMock).toHaveBeenCalled();
	});
});

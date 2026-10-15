import { render, screen } from "@testing-library/react";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockAuth, mockGetLockReadState } = vi.hoisted(() => ({
	mockRedirect: vi.fn<(url: string) => never>().mockImplementation(() => {
		throw new Error("NEXT_REDIRECT");
	}),
	mockAuth: vi.fn(),
	mockGetLockReadState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({ push: vi.fn() }),
	redirect: mockRedirect,
}));

vi.mock("~/server/auth", () => ({ auth: mockAuth }));

vi.mock("~/server/db", () => ({ db: {} }));

vi.mock("~/server/services/declarationLockService", () => ({
	getLockReadState: mockGetLockReadState,
}));

vi.mock("~/trpc/server", () => ({
	api: {
		formalNotice: { get: vi.fn() },
		company: { get: vi.fn() },
	},
}));

vi.mock("../FormalNoticeForm", async () => {
	const { useLockContext } = await import(
		"~/modules/declaration-remuneration/shared/lock/LockContext"
	);
	return {
		FormalNoticeForm: ({
			existingFile,
		}: {
			existingFile: { fileName: string } | null;
		}) => {
			const { isReadOnly } = useLockContext();
			return (
				<div>
					<span data-testid="existing-file">
						{existingFile?.fileName ?? "none"}
					</span>
					<span data-testid="read-only">{String(isReadOnly)}</span>
				</div>
			);
		},
	};
});

import { api } from "~/trpc/server";
import { FormalNoticePage } from "../FormalNoticePage";

const SIREN = "123456789";
const DECLARATION_ID = "d1";
const USER_ID = "u1";
const YEAR = 2027;
const LOCK_HOLDER = {
	firstName: "Camille",
	lastName: "Démo",
	email: "email@example.fr",
};

function mockFormalNotice(
	overrides: Partial<{
		available: boolean;
		existingFile: { id: string; fileName: string; uploadedAt: Date } | null;
	}> = {},
) {
	vi.mocked(api.formalNotice.get).mockResolvedValue({
		available: true,
		existingFile: null,
		declarationId: DECLARATION_ID,
		siren: SIREN,
		year: YEAR,
		...overrides,
	});
}

async function renderPage() {
	render(await FormalNoticePage());
}

describe("FormalNoticePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAuth.mockResolvedValue({ user: { id: USER_ID } });
		mockGetLockReadState.mockResolvedValue({
			isReadOnly: false,
			lockHolder: null,
		});
		vi.mocked(api.company.get).mockResolvedValue({
			name: "Société Démo",
			siren: SIREN,
			gipWorkforce: 250,
			hasCse: false,
		} as never);
	});

	it("redirects an unauthenticated visitor to the login page", async () => {
		mockAuth.mockResolvedValue(null);

		await expect(FormalNoticePage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/login");
		expect(api.formalNotice.get).not.toHaveBeenCalled();
	});

	it("redirects to Mon espace when the company has no current declaration", async () => {
		vi.mocked(api.formalNotice.get).mockRejectedValue(
			new TRPCError({ code: "NOT_FOUND" }),
		);

		await expect(FormalNoticePage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
		expect(api.company.get).not.toHaveBeenCalled();
	});

	it("redirects to Mon espace when the démarche is not exposed to a formal notice", async () => {
		mockFormalNotice({ available: false });

		await expect(FormalNoticePage()).rejects.toThrow("NEXT_REDIRECT");
		expect(mockRedirect).toHaveBeenCalledWith("/mon-espace");
		expect(mockGetLockReadState).not.toHaveBeenCalled();
	});

	it("rethrows any other tRPC error instead of hiding it behind a redirect", async () => {
		const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
		vi.mocked(api.formalNotice.get).mockRejectedValue(error);

		await expect(FormalNoticePage()).rejects.toBe(error);
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it("rethrows a non-tRPC failure", async () => {
		const error = new Error("network down");
		vi.mocked(api.formalNotice.get).mockRejectedValue(error);

		await expect(FormalNoticePage()).rejects.toBe(error);
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it("renders the form inside the main landmark with the company banner", async () => {
		mockFormalNotice();

		await renderPage();

		expect(screen.getByRole("main")).toHaveAttribute("id", "content");
		expect(
			screen.getByText(`Démarche des indicateurs de rémunération ${YEAR}`),
		).toBeInTheDocument();
		expect(api.company.get).toHaveBeenCalledWith({ siren: SIREN });
		expect(screen.getByTestId("existing-file")).toHaveTextContent("none");
	});

	it("passes the already-deposited report down to the form", async () => {
		mockFormalNotice({
			existingFile: {
				id: "8f14e45f-ea4c-4f0b-9c1d-7a2b3c4d5e6f",
				fileName: "rapport-mise-en-demeure.pdf",
				uploadedAt: new Date("2027-06-20"),
			},
		});

		await renderPage();

		expect(screen.getByTestId("existing-file")).toHaveTextContent(
			"rapport-mise-en-demeure.pdf",
		);
	});

	it("reads the lock of the current declaration for the signed-in user", async () => {
		mockFormalNotice();

		await renderPage();

		expect(mockGetLockReadState).toHaveBeenCalledWith(
			{},
			DECLARATION_ID,
			USER_ID,
		);
		expect(screen.getByTestId("read-only")).toHaveTextContent("false");
		expect(
			screen.queryByText("Déclaration en cours de modification"),
		).not.toBeInTheDocument();
	});

	it("turns the form read-only and names the editor when another user holds the lock", async () => {
		mockFormalNotice();
		mockGetLockReadState.mockResolvedValue({
			isReadOnly: true,
			lockHolder: LOCK_HOLDER,
		});

		await renderPage();

		expect(screen.getByTestId("read-only")).toHaveTextContent("true");
		expect(
			screen.getByText("Déclaration en cours de modification"),
		).toBeInTheDocument();
		expect(screen.getByText(/Camille Démo/)).toBeInTheDocument();
	});
});

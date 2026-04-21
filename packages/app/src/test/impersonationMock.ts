import type { useSession } from "next-auth/react";
import type { vi } from "vitest";

/**
 * Replaces the `useSession()` mock return value with an authenticated
 * session that is currently impersonating a company. Keeps the admin
 * impersonation test setup in a single place (DRY across FormActions,
 * DeclarationLink, MissingInfoModal…).
 */
export function mockImpersonatingSession(
	mockedUseSession: ReturnType<typeof vi.mocked<typeof useSession>>,
	{
		siren = "123456789",
		name = "Acme",
	}: { siren?: string; name?: string } = {},
) {
	mockedUseSession.mockReturnValue({
		data: {
			user: {
				id: "admin-1",
				impersonation: { siren, name },
			},
			expires: "2099-01-01",
		},
		status: "authenticated",
	} as unknown as ReturnType<typeof useSession>);
}

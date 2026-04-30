export const mockDeclaration = {
	id: "decl-1",
	siren: "339787277",
	year: 2026,
	currentStep: 0,
	status: "draft",
	declarantId: "user-1",
	totalWomen: null,
	totalMen: null,
};

export function createCaller(
	mockDb: unknown,
	siret: string | null = "33978727700015",
	impersonation: { siren: string; name: string } | null = null,
) {
	return import("~/server/api/routers/declaration").then(
		({ declarationRouter }) =>
			declarationRouter.createCaller({
				db: mockDb,
				session: {
					user: {
						id: "user-1",
						siret,
						isAdmin: impersonation !== null,
						impersonation,
					},
					expires: "",
				},
				headers: new Headers(),
			} as never),
	);
}

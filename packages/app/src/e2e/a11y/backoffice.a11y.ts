import { test } from "@playwright/test";
import { resolveAdminAccess } from "~/modules/domain";
import { ADMIN_MFA_RESUME } from "~/modules/routes";
import { snapshotRoute } from "./snapshot";

const ADMIN_PLAN_PATH = "/admin/plan";

// Where `/admin/plan` does not exist yet, the backoffice answers 404 at that address and
// `snapshotRoute` skips on the status rather than filing the error page under the plan's name.
// `/acces-backoffice` renders only for an administrator whose second factor is missing or
// expired, and the suite signs in through the E2E second-factor seam, which dates every
// administrator sign-in: the screen is skipped on the decision the page itself would take.
test.describe("RGAA — backoffice", () => {
	test("snapshot le plan du backoffice", async ({ page }) => {
		await snapshotRoute(page, {
			path: ADMIN_PLAN_PATH,
			id: "admin-plan",
			name: "Backoffice — plan",
			sources: ["src/app/admin/plan/page.tsx"],
			auth: true,
			notes: "Requiert un compte listé dans ADMIN_EMAILS.",
		});
	});

	test("snapshot la reprise de l'authentification au backoffice", async ({
		page,
	}) => {
		const response = await page.request.get("/api/auth/session");
		const session = (await response.json()) as {
			user?: Parameters<typeof resolveAdminAccess>[0];
		};
		const decision = resolveAdminAccess(session.user, new Date());
		test.skip(
			decision.type !== "resume",
			`la session de test aboutit à « ${decision.type} » et non à une reprise de l'authentification : ${ADMIN_MFA_RESUME} redirige, rien à échantillonner sous « Accès à l'administration — reprise de l'authentification »`,
		);

		await snapshotRoute(page, {
			path: ADMIN_MFA_RESUME,
			id: "acces-backoffice",
			name: "Accès à l'administration — reprise de l'authentification",
			sources: [
				"src/app/acces-backoffice/page.tsx",
				"src/modules/admin/access/AdminAccessPage.tsx",
			],
			auth: true,
			notes:
				"Compte listé dans ADMIN_EMAILS dont le second facteur manque ou a expiré.",
		});
	});
});

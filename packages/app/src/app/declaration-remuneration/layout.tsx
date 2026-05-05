import { redirect } from "next/navigation";
import { MissingSiret } from "~/modules/declaration-remuneration";
import { auth } from "~/server/auth";
import { getEffectiveSiren } from "~/server/auth/companyAccess";

/**
 * Shell layout for every page under `/declaration-remuneration/*`.
 * Only enforces authentication and the SIREN context — the company info
 * banner lives in the `(with-banner)` route group, so consultation
 * surfaces (e.g. `/recapitulatif`) can opt out and only render the
 * breadcrumb that fits the Figma frame.
 */
export default async function DeclarationRootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const siren = getEffectiveSiren(session);
	if (!siren) {
		return <MissingSiret />;
	}

	return <>{children}</>;
}

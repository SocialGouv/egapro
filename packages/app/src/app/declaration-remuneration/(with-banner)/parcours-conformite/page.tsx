import type { Metadata } from "next";

import { CompliancePathPage } from "~/modules/declaration-remuneration";

export const metadata: Metadata = { title: "Parcours de mise en conformité" };

export default function Page() {
	return <CompliancePathPage />;
}

import type { Metadata } from "next";

import { UnderConstructionPage } from "~/modules/error";

export const metadata: Metadata = {
	title: "En cours de construction",
	robots: { index: false, follow: false },
};

export default function UnderConstruction() {
	return <UnderConstructionPage />;
}

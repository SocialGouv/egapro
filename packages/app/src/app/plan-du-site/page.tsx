import type { Metadata } from "next";

import { SitemapPage } from "~/modules/legal";

export const metadata: Metadata = {
	title: "Plan du site",
	description:
		"Plan du site Index Egapro : liste de toutes les pages accessibles.",
};

export default function Page() {
	return <SitemapPage />;
}

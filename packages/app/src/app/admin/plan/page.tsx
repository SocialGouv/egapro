import type { Metadata } from "next";

import { AdminSitemapPage } from "~/modules/admin/sitemap";

export const metadata: Metadata = { title: "Plan du back-office" };

export default function Page() {
	return <AdminSitemapPage />;
}

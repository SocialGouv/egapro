import type { Metadata } from "next";

import { AdminReferentsPage } from "~/modules/admin";

export const metadata: Metadata = { title: "Liste des référents" };

export default function Page() {
	return <AdminReferentsPage />;
}

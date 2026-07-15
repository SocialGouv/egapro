import type { Metadata } from "next";

import { ImpersonatePage } from "~/modules/admin";

export const metadata: Metadata = { title: "Mimoquer une entreprise" };

export default function Page() {
	return <ImpersonatePage />;
}

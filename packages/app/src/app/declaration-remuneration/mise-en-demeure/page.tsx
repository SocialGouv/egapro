import type { Metadata } from "next";

import { FormalNoticePage } from "~/modules/declaration-remuneration";

export const metadata: Metadata = {
	title: "Évaluation conjointe - mise en demeure",
};

export default function Page() {
	return <FormalNoticePage />;
}

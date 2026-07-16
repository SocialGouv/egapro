import type { Metadata } from "next";

import { JointEvaluationPage } from "~/modules/declaration-remuneration";

export const metadata: Metadata = { title: "Évaluation conjointe" };

export default function Page() {
	return <JointEvaluationPage />;
}

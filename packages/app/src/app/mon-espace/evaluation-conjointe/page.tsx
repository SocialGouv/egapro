import type { Metadata } from "next";
import { JointEvaluationViewPage } from "~/modules/joint-evaluation-view";

export const metadata: Metadata = {
	title: "Rapport de l'évaluation conjointe",
};

export default function Page() {
	return <JointEvaluationViewPage />;
}

import type { Metadata } from "next";

import { FunnelCompleteTracker } from "~/modules/analytics";
import {
	COMPLIANCE_FUNNEL,
	ComplianceConfirmation,
} from "~/modules/declaration-remuneration";

export const metadata: Metadata = {
	title: "Confirmation — Parcours de mise en conformité",
};

export default function ComplianceConfirmationPage() {
	return (
		<>
			<FunnelCompleteTracker config={COMPLIANCE_FUNNEL} />
			<ComplianceConfirmation />
		</>
	);
}

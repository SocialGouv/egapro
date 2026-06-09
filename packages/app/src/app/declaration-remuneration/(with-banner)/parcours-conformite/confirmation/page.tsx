import { FunnelCompleteTracker } from "~/modules/analytics";
import {
	ComplianceConfirmation,
	COMPLIANCE_FUNNEL,
} from "~/modules/declaration-remuneration";

export default function ComplianceConfirmationPage() {
	return (
		<>
			<FunnelCompleteTracker config={COMPLIANCE_FUNNEL} />
			<ComplianceConfirmation />
		</>
	);
}

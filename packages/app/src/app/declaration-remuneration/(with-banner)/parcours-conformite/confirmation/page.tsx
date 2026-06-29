import { FunnelCompleteTracker } from "~/modules/analytics";
import {
	COMPLIANCE_FUNNEL,
	ComplianceConfirmation,
} from "~/modules/declaration-remuneration";

export default function ComplianceConfirmationPage() {
	return (
		<>
			<FunnelCompleteTracker config={COMPLIANCE_FUNNEL} />
			<ComplianceConfirmation />
		</>
	);
}

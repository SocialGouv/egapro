"use client";

import { triggerAdminStepUp } from "./adminStepUp";

type Props = {
	returnPath: string;
};

// Click-triggered, never automatic: an issuer replaying an authentication too old for our window would loop the agent.
export function AdminAccessResumeButton({ returnPath }: Props) {
	return (
		<button
			className="fr-btn"
			onClick={() => triggerAdminStepUp(returnPath)}
			type="button"
		>
			Refaire la double authentification
		</button>
	);
}

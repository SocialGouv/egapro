"use client";

import { useComplianceCompletion } from "./useComplianceCompletion";

/** Client component that triggers compliance completion on mount. */
export function ComplianceCompletionEffect() {
	useComplianceCompletion();
	return null;
}

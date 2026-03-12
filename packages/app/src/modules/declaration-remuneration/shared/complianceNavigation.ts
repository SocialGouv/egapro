const COMPLIANCE_CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";

/**
 * Returns the destination URL after completing a compliance path step,
 * based on whether the company has a CSE (works council).
 *
 * - Has CSE → redirect to CSE opinion page
 * - No CSE or unknown → redirect to the compliance confirmation page
 */
export function getPostComplianceDestination(hasCse: boolean | null): string {
	return hasCse === true ? "/avis-cse" : COMPLIANCE_CONFIRMATION_PATH;
}

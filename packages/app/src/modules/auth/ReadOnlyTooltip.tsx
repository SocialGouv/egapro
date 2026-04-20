"use client";

import { IMPERSONATION_READ_ONLY_TOOLTIP } from "./useIsImpersonating";

type Props = {
	id: string;
};

/**
 * DSFR tooltip sibling explaining that a button is disabled because the
 * admin is currently impersonating a company (issue #3230). The button must
 * carry `aria-describedby={id}` for the tooltip to be announced.
 *
 * Only rendered when the caller has already determined that impersonation
 * is active — callers should guard with `useIsImpersonating()`.
 */
export function ReadOnlyTooltip({ id }: Props) {
	return (
		<span className="fr-tooltip fr-placement" id={id} role="tooltip">
			{IMPERSONATION_READ_ONLY_TOOLTIP}
		</span>
	);
}

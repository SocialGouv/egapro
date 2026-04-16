"use client";

import { useId } from "react";

import { ReadOnlyTooltip } from "./ReadOnlyTooltip";
import { useIsImpersonating } from "./useIsImpersonating";

type ReadOnlyGuard = {
	/**
	 * `true` while the current user cannot perform write actions — callers
	 * should OR this into their button's `disabled` prop.
	 */
	isReadOnly: boolean;
	/**
	 * Props to spread onto the guarded button/input. Wires the
	 * `aria-describedby` attribute when a tooltip is rendered.
	 */
	buttonProps: { "aria-describedby": string | undefined };
	/** DSFR tooltip element — render immediately after the button sibling. */
	tooltip: React.ReactNode;
};

/**
 * Packages the read-only write-button pattern used across the forms
 * (submit button disabled + DSFR tooltip + aria-describedby) into a
 * single hook so every write surface behaves the same way during admin
 * impersonation (issue #3230).
 *
 * Consumers must wrap their `<button>` in a `<span>` (or similar) so the
 * tooltip can live as a sibling with the DSFR placement classes — the
 * tooltip is only rendered when `isReadOnly` is `true`.
 */
export function useReadOnlyGuard(): ReadOnlyGuard {
	const isImpersonating = useIsImpersonating();
	const tooltipId = useId();

	return {
		isReadOnly: isImpersonating,
		buttonProps: {
			"aria-describedby": isImpersonating ? tooltipId : undefined,
		},
		tooltip: isImpersonating ? <ReadOnlyTooltip id={tooltipId} /> : null,
	};
}

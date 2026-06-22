"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "./shared/events";
import { trackEvent } from "./trackEvent";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	href: string;
	// Stable, non-PII slug identifying the help link (e.g. "objective_criteria").
	// Never the URL — the destination may contain query params we must not log.
	trackingId: string;
	children: ReactNode;
};

/**
 * A link that emits a `help.help_link_click` Matomo event with a non-PII slug
 * on click. Renders a `next/link` for internal hrefs and a plain `<a>` for
 * external ones. The caller keeps full control of `target`/`rel` and provides
 * any `<NewTabNotice />` inside `children`.
 */
export function TrackedLink({
	href,
	trackingId,
	children,
	onClick,
	...rest
}: Props) {
	function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.HELP,
			action: MATOMO_ACTION.HELP_LINK_CLICK,
			name: trackingId,
		});
		onClick?.(event);
	}

	if (href.startsWith("http")) {
		return (
			<a href={href} onClick={handleClick} {...rest}>
				{children}
			</a>
		);
	}

	return (
		<Link href={href} onClick={handleClick} {...rest}>
			{children}
		</Link>
	);
}

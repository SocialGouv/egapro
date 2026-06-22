"use client";

import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { NavLink } from "./NavLink";

type Props = {
	href: string;
	className?: string;
	children: React.ReactNode;
};

// Same-domain path to the external consultation site, so Matomo's automatic
// outlink tracking does not cover it — track the departure explicitly.
export function ConsultationNavLink({ href, className, children }: Props) {
	return (
		<NavLink
			className={className}
			href={href}
			onClick={() =>
				trackEvent({
					category: MATOMO_EVENT_CATEGORY.SEARCH,
					action: MATOMO_ACTION.CONSULTATION_OUTBOUND,
				})
			}
		>
			{children}
		</NavLink>
	);
}

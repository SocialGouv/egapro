import { Link } from "@react-email/components";
import type { ReactNode } from "react";
import { COLORS, FONT } from "./tokens.js";

type EmailLinkProps = {
	href: string;
	children: ReactNode;
};

export function EmailLink({ href, children }: EmailLinkProps) {
	return (
		<Link
			href={href}
			style={{
				color: COLORS.blueFrance,
				fontFamily: FONT.family,
				textDecoration: "underline",
			}}
		>
			{children}
		</Link>
	);
}

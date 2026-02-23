"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
	href: string;
	className?: string;
	children: React.ReactNode;
};

export function NavLink({ href, className, children }: Props) {
	const pathname = usePathname();
	const isActive =
		pathname === href || (href !== "/" && pathname.startsWith(href));

	return (
		<Link
			aria-current={isActive ? "page" : undefined}
			className={className}
			href={href}
		>
			{children}
		</Link>
	);
}

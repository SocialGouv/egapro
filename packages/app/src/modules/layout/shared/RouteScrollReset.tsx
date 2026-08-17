"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteScrollReset() {
	const pathname = usePathname();
	const prevPathname = useRef(pathname);

	useEffect(() => {
		if (prevPathname.current === pathname) return;
		prevPathname.current = pathname;
		if (window.location.hash) return;
		window.scrollTo({ top: 0, left: 0, behavior: "instant" });
		document.getElementById("content")?.focus({ preventScroll: true });
	}, [pathname]);

	return null;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollToTop } from "~/modules/shared/scrollToTop";

export function RouteScrollReset() {
	const pathname = usePathname();
	const prevPathname = useRef(pathname);

	useEffect(() => {
		if (prevPathname.current === pathname) return;
		if (window.location.hash) return;
		prevPathname.current = pathname;
		scrollToTop();
		// Host layout must render <main id="content">, else this silently no-ops.
		document.getElementById("content")?.focus({ preventScroll: true });
	}, [pathname]);

	return null;
}

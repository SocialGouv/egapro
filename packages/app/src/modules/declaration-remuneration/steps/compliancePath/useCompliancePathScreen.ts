"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";
import { scrollToTop } from "~/modules/shared/scrollToTop";

type CompliancePathScreen = "justification" | "path";

const SCREEN_PARAM = "ecran";
const PATH_SCREEN = "parcours";

type Params = {
	draftHydrated: boolean;
	isPathScreenAvailable: boolean;
	titleRef: RefObject<HTMLHeadingElement | null>;
};

export function useCompliancePathScreen({
	draftHydrated,
	isPathScreenAvailable,
	titleRef,
}: Params) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const renderedScreen = useRef<CompliancePathScreen | undefined>(undefined);
	const hasPushedPathScreen = useRef(false);

	const screen: CompliancePathScreen =
		searchParams.get(SCREEN_PARAM) === PATH_SCREEN && isPathScreenAvailable
			? "path"
			: "justification";

	useEffect(() => {
		if (!draftHydrated) return;
		const previousScreen = renderedScreen.current;
		renderedScreen.current = screen;
		if (previousScreen === undefined || previousScreen === screen) return;
		scrollToTop();
		titleRef.current?.focus();
	}, [draftHydrated, screen, titleRef]);

	const openPathScreen = () => {
		hasPushedPathScreen.current = true;
		router.push(`${pathname}?${SCREEN_PARAM}=${PATH_SCREEN}`, {
			scroll: false,
		});
	};

	const backToJustificationScreen = () => {
		if (hasPushedPathScreen.current) {
			hasPushedPathScreen.current = false;
			router.back();
			return;
		}
		router.replace(pathname, { scroll: false });
	};

	return { screen, openPathScreen, backToJustificationScreen };
}

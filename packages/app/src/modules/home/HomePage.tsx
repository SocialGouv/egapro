import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

/** Home page — composes Hero, Search and Resources sections. */
export function HomePage() {
	return (
		<main id="content" tabIndex={-1}>
			<HomeNotice />
			<HomeHero />
			<HomeSearch />
			<HomeResources />
		</main>
	);
}

import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

/** Home page — visual content only, without tRPC provider. */
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

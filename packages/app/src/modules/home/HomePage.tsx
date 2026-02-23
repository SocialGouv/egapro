import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

/** Page d'accueil — compose les sections Hero, Recherche et Ressources. */
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

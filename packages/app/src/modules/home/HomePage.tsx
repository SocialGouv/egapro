import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

<<<<<<< HEAD
/** Home page — composes Hero, Search and Resources sections. */
||||||| 231b3558
/** Page d'accueil — contenu visuel pur, sans provider tRPC. */
=======
/** Home page — visual content only, without tRPC provider. */
>>>>>>> alpha
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

import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomePlaceholder } from "./HomePlaceholder";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

import styles from "./HomePage.module.scss";

/** Home page — visual content only, without tRPC provider. */
export function HomePage() {
	return (
		<main id="content" tabIndex={-1}>
			<HomeNotice />
			<HomeHero />
			<section aria-label="Contenu en cours de conception">
				<div className={`fr-container fr-py-14v ${styles.placeholderSection}`}>
					<HomePlaceholder />
					<HomePlaceholder />
					<HomePlaceholder />
				</div>
			</section>
			<HomeSearch />
			<HomeResources />
		</main>
	);
}

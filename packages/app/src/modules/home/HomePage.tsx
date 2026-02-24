import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomePlaceholder } from "./HomePlaceholder";
import { HomeResources } from "./HomeResources";
import { HomeSearch } from "./HomeSearch";

/** Home page — visual content only, without tRPC provider. */
export function HomePage() {
	return (
		<main id="content" tabIndex={-1}>
			<HomeNotice />
			<HomeHero />
			<section aria-label="Contenu en cours de conception">
				<div
					className="fr-container"
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "3.5rem",
						paddingBottom: "3.5rem",
						paddingTop: "3.5rem",
					}}
				>
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

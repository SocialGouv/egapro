import { HomeHero } from "./HomeHero";
import { HomeNotice } from "./HomeNotice";
import { HomeObligations } from "./HomeObligations";
import { HomeSearch } from "./HomeSearch";
import { HomeWhyDeclare } from "./HomeWhyDeclare";

type HomePageProps = {
	remunerationDeadline: Date;
	representationDeadline: Date;
};

/** Home page — visual content only, without tRPC provider. */
export function HomePage({
	remunerationDeadline,
	representationDeadline,
}: HomePageProps) {
	return (
		<main id="content" tabIndex={-1}>
			<HomeNotice />
			<HomeHero
				remunerationDeadline={remunerationDeadline}
				representationDeadline={representationDeadline}
			/>
			<HomeWhyDeclare
				remunerationDeadline={remunerationDeadline}
				representationDeadline={representationDeadline}
			/>
			<HomeObligations />
			<HomeSearch />
		</main>
	);
}

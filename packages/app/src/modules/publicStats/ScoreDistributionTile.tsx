"use client";

import { useId } from "react";

import { api } from "~/trpc/react";

import { ScoreDistributionChart } from "./ScoreDistributionChart";
import {
	ScoreDistributionLoading,
	ScoreDistributionTileError,
} from "./ScoreDistributionStates";
import { ScoreDistributionTable } from "./ScoreDistributionTable";

export function ScoreDistributionTile() {
	const query = api.publicStats.getScoreDistribution.useQuery(undefined, {
		placeholderData: (prev) => prev,
	});
	const headingId = useId();
	const tableCaptionId = useId();

	if (query.isLoading && !query.data) return <ScoreDistributionLoading />;
	if (query.isError) return <ScoreDistributionTileError />;

	const data = query.data;
	if (!data) return null;

	return (
		<section aria-labelledby={headingId} className="fr-mt-6w">
			<h2 className="fr-h3" id={headingId}>
				Distribution des scores {data.year}
			</h2>
			<p className="fr-text--sm fr-text-mention--grey fr-mb-3w">
				Répartition des entreprises ayant déclaré leur index par tranche de
				score global sur 100. La tranche « NC » regroupe les entreprises dont le
				score n'est pas calculable.
			</p>
			<ScoreDistributionChart brackets={data.brackets} />
			<ScoreDistributionTable
				brackets={data.brackets}
				captionId={tableCaptionId}
			/>
		</section>
	);
}

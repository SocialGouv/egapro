"use client";

import { useEffect, useRef, useState } from "react";

import { Breadcrumb } from "~/modules/layout";
import { api } from "~/trpc/react";
import type { HistoryItem } from "./HistoryEntry";
import { HistoryEntry } from "./HistoryEntry";

type EntryRowProps = { item: HistoryItem; showDivider: boolean };

function EntryRow({ item, showDivider }: EntryRowProps) {
	return (
		<>
			{showDivider && <hr className="fr-hr fr-mt-0" />}
			<HistoryEntry item={item} />
		</>
	);
}

const LIMIT = 10;

type Props = {
	siren: string;
	year: number;
};

export function DeclarationHistoryPage({ siren, year }: Props) {
	const [offset, setOffset] = useState(0);
	const [allItems, setAllItems] = useState<HistoryItem[]>([]);
	const [total, setTotal] = useState(0);
	const loadedOffsets = useRef(new Set<number>());

	const { data, isFetching } = api.declaration.getStatusHistory.useQuery({
		siren,
		year,
		limit: LIMIT,
		offset,
	});

	useEffect(() => {
		if (!data || loadedOffsets.current.has(offset)) return;
		loadedOffsets.current.add(offset);
		setTotal(data.total);
		setAllItems((prev) =>
			offset === 0 ? [...data.items] : [...prev, ...data.items],
		);
	}, [data, offset]);

	const hasMore = allItems.length < total;

	return (
		<main id="content">
			<div className="fr-container fr-py-4w">
				<Breadcrumb
					items={[
						{ label: "Mon espace", href: "/mon-espace" },
						{ label: "Historique des actions" },
					]}
				/>
				<h1 className="fr-h1 fr-mt-3w">Historique des modifications</h1>
				<p className="fr-text--lg fr-mb-4w">
					Démarche des indicateurs de rémunération {year}
				</p>

				{allItems.length === 0 && !isFetching ? (
					<p>Aucune action enregistrée pour cette démarche.</p>
				) : (
					<ul className="fr-m-0 fr-p-0">
						{allItems.map((item, index) => (
							<EntryRow item={item} key={item.id} showDivider={index > 0} />
						))}
					</ul>
				)}

				{hasMore && (
					<div className="fr-mt-3w">
						<button
							className="fr-btn fr-btn--tertiary-no-outline"
							disabled={isFetching}
							onClick={() => setOffset((o) => o + LIMIT)}
							type="button"
						>
							Voir plus
						</button>
					</div>
				)}
			</div>
		</main>
	);
}

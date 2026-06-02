"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";
import type { HistoryItem } from "./HistoryEntry";
import { HistoryEntry } from "./HistoryEntry";
import styles from "./HistoryListSection.module.scss";

const LIMIT = 10;

type Props = {
	siren: string;
	year: number;
};

export function HistoryListSection({ siren, year }: Props) {
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

	if (allItems.length === 0 && !isFetching) {
		return <p>Aucune action enregistrée pour cette démarche.</p>;
	}

	return (
		<>
			<ul className={`fr-m-0 fr-p-0 ${styles.list}`}>
				{allItems.map((item) => (
					<HistoryEntry item={item} key={item.id} />
				))}
			</ul>

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
		</>
	);
}

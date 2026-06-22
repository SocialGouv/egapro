import Link from "next/link";
import type { DeclarationEventType, HistoryEventDisplay } from "./eventDisplay";
import { getHistoryEventDisplay } from "./eventDisplay";

export type HistoryItem = {
	id: string;
	eventType: DeclarationEventType;
	value: string | null;
	round: number | null;
	createdAt: Date;
	actor: {
		firstName: string | null;
		lastName: string | null;
		email: string;
	} | null;
};

type Props = {
	item: HistoryItem;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function formatActorName(actor: HistoryItem["actor"]): string {
	if (!actor) return "Système";
	const parts = [actor.firstName, actor.lastName].filter(Boolean);
	return parts.length > 0 ? parts.join(" ") : actor.email;
}

function EntryAction({ display }: { display: HistoryEventDisplay }) {
	if (!display.pageLabel) {
		return <span className="fr-text--sm">{display.label}</span>;
	}

	return (
		<span>
			<span className="fr-text--sm fr-text-mention--grey">Page : </span>
			{display.pageHref ? (
				<Link className="fr-link fr-text--sm" href={display.pageHref}>
					{display.pageLabel}
				</Link>
			) : (
				<span className="fr-text--sm">{display.pageLabel}</span>
			)}
		</span>
	);
}

export function HistoryEntry({ item }: Props) {
	const createdAt = new Date(item.createdAt);
	const display = getHistoryEventDisplay({
		eventType: item.eventType,
		value: item.value,
		round: item.round,
	});
	const actorName = formatActorName(item.actor);

	return (
		<li className="fr-py-3w">
			<div className="fr-grid-row fr-grid-row--gutters">
				<div className="fr-col-12 fr-col-md-2">
					<time
						className="fr-text--sm fr-text--bold"
						dateTime={createdAt.toISOString()}
					>
						{dateFormatter.format(createdAt)}
					</time>
					<br />
					<span className="fr-text--sm fr-text-mention--grey">
						{timeFormatter.format(createdAt)}
					</span>
				</div>
				<div className="fr-col-12 fr-col-md-4">
					<span className="fr-text--sm fr-text--bold">{actorName}</span>
					{item.actor && (
						<>
							<br />
							<span className="fr-text--sm fr-text-mention--grey">
								{item.actor.email}
							</span>
						</>
					)}
				</div>
				<div className="fr-col-12 fr-col-md-6">
					<EntryAction display={display} />
				</div>
			</div>
		</li>
	);
}

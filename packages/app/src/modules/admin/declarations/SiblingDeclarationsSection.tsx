import Link from "next/link";
import { formatShortDateTime, isCancelled } from "~/modules/domain";
import { STATUS_LABELS } from "./shared/constants";

type Sibling = {
	id: string;
	cancelledAt: Date | null;
	updatedAt: Date | null;
	status: string;
};

type Props = {
	siblings: Sibling[];
};

export function SiblingDeclarationsSection({ siblings }: Props) {
	if (siblings.length === 0) {
		return null;
	}

	return (
		<section className="fr-mt-4w">
			<h2 className="fr-h5">Autres déclarations pour ce SIREN / cette année</h2>
			<ul className="fr-raw-list">
				{siblings.map((sibling) => (
					<li className="fr-mb-1w" key={sibling.id}>
						<Link
							aria-label={`Voir la déclaration du ${formatShortDateTime(sibling.updatedAt)}`}
							href={`/admin/declarations/${sibling.id}`}
						>
							{formatShortDateTime(sibling.updatedAt)}
						</Link>
						{" — "}
						{isCancelled(sibling) ? (
							<span className="fr-badge fr-badge--warning">Annulée</span>
						) : (
							(STATUS_LABELS[sibling.status] ?? sibling.status)
						)}
					</li>
				))}
			</ul>
		</section>
	);
}

import { formatOptionalIsoDate } from "~/modules/domain";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { toAbsoluteHttpUrl } from "../schemas";
import type { RepresentationDraft } from "../types";
import type { InfoItem } from "./InfoList";

function PublicationUrl({ url }: { url: string | undefined }) {
	if (url === undefined || url.trim() === "") return "—";
	const href = toAbsoluteHttpUrl(url);
	if (href === null) return url;
	return (
		<a
			className="fr-link"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{url}
			<NewTabNotice />
		</a>
	);
}

type PublicationDraft = Pick<
	RepresentationDraft,
	"publishDate" | "hasWebsite" | "publishUrl" | "publishModalities"
>;

// Shared by Step5Review and the "Mon espace" consultation page, both reading a `RepresentationDraft`.
export function publicationInfoItems(draft: PublicationDraft): InfoItem[] {
	const items: InfoItem[] = [
		{
			label: "Date de publication",
			value: formatOptionalIsoDate(draft.publishDate),
		},
		{
			label: "Site Internet de publication",
			value: draft.hasWebsite === true ? "Oui" : "Non",
		},
	];

	if (draft.hasWebsite === true) {
		items.push({
			label: "Adresse de la page (URL)",
			value: <PublicationUrl url={draft.publishUrl} />,
		});
	} else {
		items.push({
			label: "Modalités de communication",
			value: draft.publishModalities ?? "—",
		});
	}

	return items;
}

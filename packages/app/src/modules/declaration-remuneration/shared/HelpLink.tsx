import type { ReactNode } from "react";
import { TrackedLink } from "~/modules/analytics";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";

type Props = {
	children: ReactNode;
	trackingId: string;
};

export function HelpLink({ children, trackingId }: Props) {
	return (
		<TrackedLink
			className="fr-link"
			href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle"
			rel="noopener noreferrer"
			target="_blank"
			trackingId={trackingId}
		>
			{children}
			<NewTabNotice />
		</TrackedLink>
	);
}

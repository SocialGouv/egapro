import type { ReactNode } from "react";

import { ErrorArtwork } from "./ErrorArtwork";

type Props = {
	children: ReactNode;
};

/** Shared DSFR error page layout with grid wrapper and decorative artwork. */
export function ErrorLayout({ children }: Props) {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container">
				<div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
					<div className="fr-py-0 fr-col-12 fr-col-md-6">{children}</div>
					<div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
						<ErrorArtwork />
					</div>
				</div>
			</div>
		</main>
	);
}

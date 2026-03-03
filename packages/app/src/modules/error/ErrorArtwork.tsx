const OVOID_PATH = "/dsfr/artwork/background/ovoid.svg";
const PICTOGRAM_PATH = "/dsfr/artwork/pictograms/system/technical-error.svg";

/** DSFR artwork illustration for error pages (ovoid background + technical-error pictogram). */
export function ErrorArtwork() {
	return (
		<svg
			aria-hidden="true"
			className="fr-responsive-img fr-artwork"
			height="200"
			viewBox="0 0 160 200"
			width="160"
			xmlns="http://www.w3.org/2000/svg"
		>
			<use className="fr-artwork-motif" href={`${OVOID_PATH}#artwork-motif`} />
			<use
				className="fr-artwork-background"
				href={`${OVOID_PATH}#artwork-background`}
			/>
			<g transform="translate(40, 60)">
				<use
					className="fr-artwork-decorative"
					href={`${PICTOGRAM_PATH}#artwork-decorative`}
				/>
				<use
					className="fr-artwork-minor"
					href={`${PICTOGRAM_PATH}#artwork-minor`}
				/>
				<use
					className="fr-artwork-major"
					href={`${PICTOGRAM_PATH}#artwork-major`}
				/>
			</g>
		</svg>
	);
}

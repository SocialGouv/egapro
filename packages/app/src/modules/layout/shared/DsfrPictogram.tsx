type Props = {
	className?: string;
	path: string;
	size?: number;
};

/**
 * Official DSFR pictogram pattern using SVG <use> references.
 * Wraps the 3-layer artwork structure (decorative, minor, major).
 * Pass a DSFR colour-scheme modifier (e.g. "fr-artwork--green-emeraude")
 * through `className` to recolour the artwork.
 */
export function DsfrPictogram({ className, path, size = 40 }: Props) {
	return (
		<svg
			aria-hidden="true"
			className={className ? `fr-artwork ${className}` : "fr-artwork"}
			height={`${size}px`}
			viewBox="0 0 80 80"
			width={`${size}px`}
		>
			<use
				className="fr-artwork-decorative"
				href={`${path}#artwork-decorative`}
			/>
			<use className="fr-artwork-minor" href={`${path}#artwork-minor`} />
			<use className="fr-artwork-major" href={`${path}#artwork-major`} />
		</svg>
	);
}

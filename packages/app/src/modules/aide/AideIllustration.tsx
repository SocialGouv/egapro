import Image from "next/image";

/** Decorative help illustration displayed at the bottom of aide pages. */
export function AideIllustration() {
	return (
		<div
			aria-hidden="true"
			className="fr-grid-row fr-grid-row--center fr-mt-6w"
		>
			<Image
				alt=""
				height={147}
				src="/assets/images/home/help-illustration.svg"
				unoptimized
				width={210}
			/>
		</div>
	);
}

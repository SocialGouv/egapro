import type { ReactNode } from "react";

type Props = {
	caption: string;
	children: ReactNode;
	className?: string;
	/** Applied to the `<table>` itself, for layout rules a wrapper cannot set. */
	tableClassName?: string;
};

export function DsfrTable({
	caption,
	children,
	className = "fr-mb-4w",
	tableClassName,
}: Props) {
	return (
		<div className={`fr-table ${className}`}>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table className={tableClassName}>
							<caption className="fr-sr-only">{caption}</caption>
							{children}
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

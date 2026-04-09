import type { ReactNode } from "react";

type Props = {
	caption: string;
	children: ReactNode;
	className?: string;
};

export function DsfrTable({
	caption,
	children,
	className = "fr-mb-4w",
}: Props) {
	return (
		<div className={`fr-table ${className}`}>
			<div className="fr-table__wrapper">
				<div className="fr-table__container">
					<div className="fr-table__content">
						<table>
							<caption className="fr-sr-only">{caption}</caption>
							{children}
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

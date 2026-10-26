import { Fragment, type ReactNode } from "react";
import styles from "./InfoList.module.scss";

export type InfoItem = { label: string; value: ReactNode };

export function InfoList({ items }: { items: InfoItem[] }) {
	return (
		<dl className={`fr-raw-list fr-text--md ${styles.definitionList}`}>
			{items.map((item) => (
				<Fragment key={item.label}>
					<dt>{item.label}</dt>
					<dd>{item.value}</dd>
				</Fragment>
			))}
		</dl>
	);
}

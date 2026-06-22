import type { ReactNode } from "react";

import { AdminNavigation } from "./AdminNavigation";
import styles from "./AdminShell.module.scss";

type Props = { children: ReactNode };

export function AdminShell({ children }: Props) {
	return (
		<div className="fr-container--fluid fr-py-6w">
			<div className={styles.shell}>
				<div className={styles.nav}>
					<AdminNavigation />
				</div>
				<div className={styles.content}>{children}</div>
			</div>
		</div>
	);
}

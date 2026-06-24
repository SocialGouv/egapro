import { env } from "~/env.js";

import styles from "./MatomoOptOut.module.scss";

// Official Matomo opt-out iframe (CNIL exemption); no-op until Matomo is configured.
export function MatomoOptOut() {
	const matomoUrl = env.NEXT_PUBLIC_MATOMO_URL;
	if (!matomoUrl) return null;

	const optOutUrl = `${matomoUrl.replace(/\/$/, "")}/index.php?module=CoreAdminHome&action=optOut&language=fr`;

	return (
		<iframe
			className={styles.optOut}
			src={optOutUrl}
			title="Refuser ou accepter la mesure d'audience anonyme (Matomo)"
		/>
	);
}

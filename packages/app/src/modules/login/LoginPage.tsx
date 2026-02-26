import Image from "next/image";

import { LoginForm } from "./LoginForm";
import styles from "./LoginPage.module.scss";

/**
 * Login page with responsive layout:
 * - Mobile: single column — form on top, illustration below with blue background.
 * - Desktop (md+): two-column row — form on the left, illustration on the right.
 *
 * On desktop, each column uses an inner wrapper with `max-width: 39rem`
 * (half of fr-container) to align content with the header's fr-container edges.
 */
export function LoginPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className={styles.columns}>
				{/* Form column */}
				<div className={styles.formColumn}>
					<div className={styles.formInner}>
						<LoginForm />
					</div>
				</div>

				{/* Illustration column — blue background, always visible */}
				<div aria-hidden="true" className={styles.illustrationColumn}>
					<div className={styles.illustrationInner}>
						<Image
							alt=""
							className={styles.illustration}
							height={220}
							src="/assets/images/login-illustration.svg"
							width={362}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}

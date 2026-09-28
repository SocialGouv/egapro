import Image from "next/image";

import { LoginForm } from "./LoginForm";
import styles from "./LoginPage.module.scss";

type Props = {
	callbackUrl?: string;
};

export function LoginPage({ callbackUrl }: Props) {
	return (
		<main id="content" tabIndex={-1}>
			<div className={styles.container}>
				<div className={styles.columns}>
					<div className={styles.formColumn}>
						<div className={styles.formInner}>
							<LoginForm callbackUrl={callbackUrl} />
						</div>
					</div>

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
			</div>
		</main>
	);
}

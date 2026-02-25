"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import styles from "../modules/error/ErrorImage.module.scss";

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html data-fr-scheme="system" lang="fr">
			<head>
				<link href="/dsfr/dsfr.min.css" rel="stylesheet" />
			</head>
			<body>
				<main id="content">
					<div className="fr-container">
						<div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
							<div className="fr-py-0 fr-col-12 fr-col-md-6">
								<h1>Erreur inattendue</h1>
								<p className="fr-text--sm fr-mb-3w">Erreur 500</p>
								<p className="fr-text--sm fr-mb-5w">
									Désolé, le service rencontre un problème, nous travaillons
									pour le résoudre le plus rapidement possible.
								</p>
								<p className="fr-text--lead fr-mb-3w">
									Essayez de rafraîchir la page ou bien réessayez plus tard.
								</p>
							</div>
							<div
								className={`fr-col-12 fr-col-md-4 fr-col-offset-md-1 fr-py-0 ${styles.container}`}
							>
								<img
									alt=""
									aria-hidden="true"
									className={styles.image}
									src="/assets/images/error/technical-error-illustration.svg"
								/>
							</div>
						</div>
					</div>
				</main>
			</body>
		</html>
	);
}

"use client";

import { useEffect, useRef } from "react";

import {
	MISSING_OPINION_ALERT_TITLE,
	NO_FILE_ALERT,
	UNASSOCIATED_FILE_ALERT,
} from "../contentTypeColumns";

export type SubmissionAlertSnapshot = {
	attempt: number;
	noFile: boolean;
	missing: Array<{ id: string; message: string }>;
	unassociated: boolean;
};

type Props = {
	snapshot: SubmissionAlertSnapshot;
	stillNoFile: boolean;
	stillMissingIds: ReadonlySet<string>;
	stillUnassociated: boolean;
};

export function SubmissionAlerts({
	snapshot,
	stillNoFile,
	stillMissingIds,
	stillUnassociated,
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		containerRef.current?.focus();
	}, []);

	const showNoFile = snapshot.noFile && stillNoFile;
	const missing = snapshot.missing.filter(({ id }) => stillMissingIds.has(id));
	const showMissing = missing.length > 0;
	const showUnassociated = snapshot.unassociated && stillUnassociated;

	if (!showNoFile && !showMissing && !showUnassociated) return null;

	return (
		<div ref={containerRef} role="alert" tabIndex={-1}>
			{showNoFile && (
				<div className="fr-alert fr-alert--error">
					<h2 className="fr-alert__title">{NO_FILE_ALERT.title}</h2>
					<p>{NO_FILE_ALERT.message}</p>
				</div>
			)}
			{showMissing && (
				<div className="fr-alert fr-alert--error">
					<h2 className="fr-alert__title">{MISSING_OPINION_ALERT_TITLE}</h2>
					{missing.map(({ id, message }) => (
						<p key={id}>{message}</p>
					))}
				</div>
			)}
			{showUnassociated && (
				<div className="fr-alert fr-alert--error">
					<h2 className="fr-alert__title">{UNASSOCIATED_FILE_ALERT.title}</h2>
					<p>{UNASSOCIATED_FILE_ALERT.message}</p>
				</div>
			)}
		</div>
	);
}

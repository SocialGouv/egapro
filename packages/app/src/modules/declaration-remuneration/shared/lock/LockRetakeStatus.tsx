"use client";

import { useEffect } from "react";

import { formatLockHolderIdentity } from "./lockHolderIdentity";
import { type LockRetakeView, resolveLockRetakeView } from "./lockRetakeView";
import type { LockHolderDisplay, LockRetake } from "./types";

type Props = {
	retake: LockRetake | undefined;
	holder: LockHolderDisplay | null;
};

type RetakeMessage = {
	alertClassName: string;
	text: string;
};

function buildRetakeMessage(
	view: LockRetakeView,
	holder: LockHolderDisplay | null,
): RetakeMessage {
	switch (view) {
		case "available":
			return {
				alertClassName: "fr-alert--info",
				text: "La déclaration n'est plus en cours de modification.",
			};
		case "outpaced": {
			const identity =
				formatLockHolderIdentity(holder) ?? "Un autre utilisateur";
			return {
				alertClassName: "fr-alert--info",
				text: `${identity} a commencé à modifier la déclaration avant vous. Vous restez en lecture seule.`,
			};
		}
		case "failed":
			return {
				alertClassName: "fr-alert--error",
				text: "La reprise de la modification n'a pas abouti. Réessayez.",
			};
		case "succeeded":
			return {
				alertClassName: "fr-alert--success",
				text: "Vous pouvez maintenant modifier la déclaration.",
			};
	}
}

export function LockRetakeStatus({ retake, holder }: Props) {
	const view = resolveLockRetakeView(retake);
	const message = view ? buildRetakeMessage(view, holder) : null;
	const showRetakeButton =
		view === "available" || (view === "failed" && retake?.isAvailable);

	useEffect(() => {
		if (view !== "succeeded") return;
		// The retake button just vanished: hand focus to the page instead of dropping it on <body>.
		document.getElementById("content")?.focus({ preventScroll: true });
	}, [view]);

	return (
		<div role="status">
			{message && (
				<div
					className={`fr-alert ${message.alertClassName} fr-alert--sm fr-mb-3w`}
				>
					<p>{message.text}</p>
				</div>
			)}
			{showRetakeButton && retake && (
				<button
					className="fr-btn fr-btn--sm fr-mb-3w"
					onClick={retake.retake}
					type="button"
				>
					Modifier la déclaration
				</button>
			)}
		</div>
	);
}

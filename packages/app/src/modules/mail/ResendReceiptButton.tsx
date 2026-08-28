"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { ResendReceiptInput } from "./schemas";

type Props = {
	kind: ResendReceiptInput["kind"];
	size?: "default" | "sm";
	year: number;
};

export function ResendReceiptButton({ kind, size = "default", year }: Props) {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

	const mutation = api.mail.resendReceipt.useMutation({
		onSuccess: () => setStatus("success"),
		onError: () => setStatus("error"),
	});

	return (
		<>
			<button
				className={
					size === "sm"
						? "fr-btn fr-btn--tertiary fr-btn--sm"
						: "fr-btn fr-btn--tertiary"
				}
				disabled={mutation.isPending}
				onClick={() => {
					setStatus("idle");
					mutation.mutate({ kind, year });
				}}
				type="button"
			>
				{mutation.isPending
					? "Envoi en cours…"
					: "Renvoyer l'accusé de réception"}
			</button>
			{/* Stays mounted for aria-live, but takes no vertical space while empty. */}
			<p
				aria-live="polite"
				className={
					status === "idle"
						? "fr-text--xs fr-mb-0"
						: "fr-text--xs fr-mt-1w fr-mb-0"
				}
				role="status"
			>
				{status === "success"
					? "L'accusé de réception a été renvoyé."
					: status === "error"
						? "Impossible de renvoyer l'accusé de réception. Réessayez plus tard."
						: ""}
			</p>
		</>
	);
}

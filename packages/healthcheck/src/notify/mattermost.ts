import type { ProbeStatus } from "../probes/types.js";
import { sanitizeMessage } from "../sanitize.js";
import type { ProbeNotification } from "./policy.js";

const DEFAULT_TIMEOUT_MS = 5000;
const ADMIN_SERVICE_STATUS_PATH = "/admin/etat-des-services";

const STATUS_LABELS: Record<ProbeStatus, string> = {
	operational: "Opérationnel",
	degraded: "Dégradé",
	unavailable: "Indisponible",
	misconfigured: "Mal configuré",
};

const CRITICALITY_LABELS: Record<
	ProbeNotification["probe"]["criticality"],
	string
> = {
	critical: "Critique",
	important: "Important",
	low: "Faible",
};

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "short",
	timeStyle: "short",
	timeZone: "Europe/Paris",
});

const COUNT_FORMAT = new Intl.NumberFormat("fr-FR");

export type MattermostNotifier = {
	/** Never throws: a webhook outage must not stop the prober. */
	notify(notification: ProbeNotification): Promise<boolean>;
};

export type MattermostNotifierOptions = {
	webhookUrl: string;
	/** Base URL of the back-office; the link is omitted when absent. */
	adminUrl: string | null;
	secrets?: readonly string[];
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
	logError?: (message: string) => void;
};

export function createMattermostNotifier({
	webhookUrl,
	adminUrl,
	secrets = [],
	timeoutMs = DEFAULT_TIMEOUT_MS,
	fetchImpl = fetch,
	logError = (message) => console.error(message),
}: MattermostNotifierOptions): MattermostNotifier {
	const text = (notification: ProbeNotification) =>
		formatMattermostText(notification, adminUrl, secrets);

	return {
		async notify(notification) {
			try {
				const response = await fetchImpl(webhookUrl, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ text: text(notification) }),
					signal: AbortSignal.timeout(timeoutMs),
				});

				if (!response.ok) {
					logError(
						`[healthcheck] Mattermost alert not sent: HTTP ${response.status}`,
					);
					return false;
				}

				return true;
			} catch (error) {
				logError(
					`[healthcheck] Mattermost alert not sent: ${sanitizeMessage(error, secrets)}`,
				);
				return false;
			}
		},
	};
}

/**
 * Message text for one transition. Only the sanitized probe message, the
 * labels and the screen link leave the worker: no secret, no response header
 * or body, no signed URL.
 */
export function formatMattermostText(
	notification: ProbeNotification,
	adminUrl: string | null,
	secrets: readonly string[] = [],
): string {
	const { probe, status, statusSince, checkedAt, latencyMs, message } =
		notification;
	const recovered = notification.kind === "recovery";
	const icon = recovered ? ":white_check_mark:" : ":rotating_light:";
	const title = recovered
		? `Rétabli — ${probe.label}`
		: `${STATUS_LABELS[status]} — ${probe.label}`;

	const lines = [
		`#### ${icon} ${title}`,
		`- **Criticité** : ${CRITICALITY_LABELS[probe.criticality]}`,
		`- **Depuis** : ${formatElapsed(checkedAt.getTime() - statusSince.getTime())} (${DATE_FORMAT.format(statusSince)})`,
	];

	if (!recovered) {
		lines.push(
			`- **Échecs consécutifs** : ${COUNT_FORMAT.format(notification.consecutiveFailures)}`,
		);
	}

	lines.push(`- **Latence** : ${COUNT_FORMAT.format(latencyMs)} ms`);

	const detail = message ? sanitizeMessage(message, secrets) : null;
	if (detail) lines.push(`- **Message** : ${detail}`);

	if (notification.nextExpectedAt) {
		lines.push(
			`- **Prochaine exécution attendue** : ${DATE_FORMAT.format(notification.nextExpectedAt)}`,
		);
	}

	if (adminUrl) {
		const base = adminUrl.replace(/\/+$/, "");
		lines.push("");
		lines.push(
			`[Consulter l'état des services](${base}${ADMIN_SERVICE_STATUS_PATH})`,
		);
	}

	return lines.join("\n");
}

function formatElapsed(milliseconds: number): string {
	const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
	if (minutes < 60) return `${COUNT_FORMAT.format(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 48) return `${COUNT_FORMAT.format(hours)} h`;
	return `${COUNT_FORMAT.format(Math.floor(hours / 24))} j`;
}

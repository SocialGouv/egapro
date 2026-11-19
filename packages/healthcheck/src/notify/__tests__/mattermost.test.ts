import { describe, expect, it, vi } from "vitest";

import {
	createMattermostNotifier,
	formatMattermostText,
} from "../mattermost.js";
import type { ProbeNotification } from "../policy.js";

const ADMIN_URL = "https://egapro.example.gouv.fr";

const alert: ProbeNotification = {
	kind: "alert",
	probe: {
		key: "clamav",
		label: "ClamAV",
		criticality: "critical",
		kind: "internal",
	},
	status: "unavailable",
	statusSince: new Date("2026-11-19T09:55:00.000Z"),
	checkedAt: new Date("2026-11-19T10:00:00.000Z"),
	consecutiveFailures: 3,
	latencyMs: 5000,
	message: "timeout after 5000 ms",
	nextExpectedAt: null,
};

const jobAlert: ProbeNotification = {
	...alert,
	probe: {
		key: "job-gip-mds-import",
		label: "Import GIP-MDS",
		criticality: "critical",
		kind: "job",
	},
	nextExpectedAt: new Date("2026-11-20T03:00:00.000Z"),
};

describe("formatMattermostText", () => {
	it("names the probe, its state, the outage age and the screen link", () => {
		const text = formatMattermostText(alert, ADMIN_URL);

		expect(text).toContain("#### :rotating_light: Indisponible — ClamAV");
		expect(text).toContain("- **Criticité** : Critique");
		expect(text).toContain("- **Depuis** : 5 min");
		expect(text).toContain("- **Échecs consécutifs** : 3");
		expect(text).toContain("- **Latence** : 5\u202f000 ms");
		expect(text).toContain("- **Message** : timeout after 5000 ms");
		expect(text).toContain(
			"[Consulter l'état des services](https://egapro.example.gouv.fr/admin/etat-des-services)",
		);
	});

	it("prints the next expected run of a scheduled job", () => {
		const text = formatMattermostText(jobAlert, ADMIN_URL);

		expect(text).toContain("- **Prochaine exécution attendue** : ");
	});

	it("marks a recovery and stops counting failures", () => {
		const text = formatMattermostText(
			{ ...alert, kind: "recovery", status: "operational" },
			ADMIN_URL,
		);

		expect(text).toContain("#### :white_check_mark: Rétabli — ClamAV");
		expect(text).not.toContain("Échecs consécutifs");
	});

	it("omits the link when no back-office URL is configured", () => {
		expect(formatMattermostText(alert, null)).not.toContain(
			"Consulter l'état des services",
		);
	});

	it("strips credentials, paths and long tokens from a trapped message", () => {
		const secret = "supervision-secret-key";
		const text = formatMattermostText(
			{
				...alert,
				message: `GET https://user:pass@partner.example/private?token=abc failed ${secret}`,
			},
			ADMIN_URL,
			[secret],
		);

		expect(text).toContain("- **Message** : GET https://partner.example");
		expect(text).not.toContain("user:pass");
		expect(text).not.toContain("/private");
		expect(text).not.toContain(secret);
	});

	it("never contains the webhook URL", () => {
		const webhook =
			"https://mattermost.example/hooks/abcdefghijklmnopqrstuvwxyz012345";

		const text = formatMattermostText(alert, ADMIN_URL, [webhook]);

		expect(text).not.toContain("mattermost.example/hooks");
	});
});

describe("createMattermostNotifier", () => {
	function response(status = 200): Response {
		return new Response(null, { status });
	}

	it("posts one JSON text payload to the webhook", async () => {
		const fetchImpl = vi.fn(async () => response());

		const sent = await createMattermostNotifier({
			webhookUrl: "https://mattermost.example/hooks/abc",
			adminUrl: ADMIN_URL,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		}).notify(alert);

		expect(sent).toBe(true);
		expect(fetchImpl).toHaveBeenCalledOnce();
		const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("https://mattermost.example/hooks/abc");
		expect(init.method).toBe("POST");
		expect(JSON.parse(String(init.body))).toEqual({
			text: formatMattermostText(alert, ADMIN_URL),
		});
	});

	it("logs a refused send without throwing", async () => {
		const logError = vi.fn();

		const sent = await createMattermostNotifier({
			webhookUrl: "https://mattermost.example/hooks/abc",
			adminUrl: ADMIN_URL,
			fetchImpl: (async () => response(500)) as unknown as typeof fetch,
			logError,
		}).notify(alert);

		expect(sent).toBe(false);
		expect(logError).toHaveBeenCalledWith(
			"[healthcheck] Mattermost alert not sent: HTTP 500",
		);
	});

	it("logs a network failure with the webhook redacted", async () => {
		const webhook = "https://mattermost.example/hooks/secret-token";
		const logError = vi.fn();

		const sent = await createMattermostNotifier({
			webhookUrl: webhook,
			adminUrl: ADMIN_URL,
			secrets: [webhook],
			fetchImpl: (async () => {
				throw new Error(`connect ECONNREFUSED ${webhook}`);
			}) as unknown as typeof fetch,
			logError,
		}).notify(alert);

		expect(sent).toBe(false);
		const [line] = logError.mock.calls[0] as [string];
		expect(line).toContain("ECONNREFUSED");
		expect(line).not.toContain("secret-token");
	});

	it("sends a text with the sanitized probe message", async () => {
		const fetchImpl = vi.fn(async () => response());

		await createMattermostNotifier({
			webhookUrl: "https://mattermost.example/hooks/abc",
			adminUrl: ADMIN_URL,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		}).notify({ ...alert, message: "boom" });

		const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
		expect(JSON.parse(String(init.body)).text).toContain(
			"- **Message** : boom",
		);
	});
});

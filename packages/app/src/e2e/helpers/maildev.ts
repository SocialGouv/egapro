const MAILDEV_URL = process.env.MAILDEV_URL ?? "http://localhost:1080";

export type MailDevAddress = { address: string; name?: string };

export type MailDevEmail = {
	id: string;
	to: MailDevAddress[];
	subject: string;
	html: string;
	text?: string;
	date?: string;
};

export async function maildevReachable(): Promise<boolean> {
	try {
		const res = await fetch(`${MAILDEV_URL}/email`, { method: "GET" });
		return res.ok;
	} catch {
		return false;
	}
}

export async function clearMaildev(): Promise<void> {
	await fetch(`${MAILDEV_URL}/email/all`, { method: "DELETE" }).catch(() => {});
}

export async function listEmailsTo(recipient: string): Promise<MailDevEmail[]> {
	const res = await fetch(`${MAILDEV_URL}/email`);
	if (!res.ok) return [];
	const all = (await res.json()) as MailDevEmail[];
	return all.filter((m) =>
		m.to?.some((r) => r.address.toLowerCase() === recipient.toLowerCase()),
	);
}

export async function waitForEmail(
	recipient: string,
	predicate: (m: MailDevEmail) => boolean,
	options: { since?: Date; timeoutMs?: number } = {},
): Promise<MailDevEmail> {
	const { since, timeoutMs = 30_000 } = options;
	const sinceMs = since?.getTime();
	const deadline = Date.now() + timeoutMs;
	let last: MailDevEmail[] = [];
	while (Date.now() < deadline) {
		last = await listEmailsTo(recipient);
		const fresh =
			sinceMs === undefined
				? last
				: last.filter((m) =>
						m.date ? new Date(m.date).getTime() >= sinceMs : true,
					);
		const match = fresh.find(predicate);
		if (match) return match;
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(
		`No email matching predicate for ${recipient} within ${timeoutMs}ms (saw ${last.length} addressed to it)`,
	);
}

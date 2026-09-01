const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:1080";

export type MailpitAddress = { address: string; name?: string };

export type MailpitEmail = {
	id: string;
	to: MailpitAddress[];
	subject: string;
	html: string;
	text?: string;
	date?: string;
};

type MailpitApiAddress = { Address: string; Name?: string };

type MailpitMessageSummary = {
	ID: string;
	To?: MailpitApiAddress[];
	Subject: string;
	Created?: string;
};

type MailpitMessagesResponse = {
	messages?: MailpitMessageSummary[];
};

type MailpitMessageDetail = {
	ID: string;
	To?: MailpitApiAddress[];
	Subject: string;
	HTML?: string;
	Text?: string;
	Date?: string;
	Created?: string;
};

function mapAddress(entry: MailpitApiAddress): MailpitAddress {
	return { address: entry.Address, name: entry.Name };
}

function toEmail(raw: MailpitMessageDetail): MailpitEmail {
	return {
		id: raw.ID,
		to: (raw.To ?? []).map(mapAddress),
		subject: raw.Subject,
		html: raw.HTML ?? "",
		text: raw.Text,
		date: raw.Date ?? raw.Created,
	};
}

export async function mailpitReachable(): Promise<boolean> {
	try {
		const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=1`);
		return res.ok;
	} catch {
		return false;
	}
}

export async function clearMailpit(): Promise<void> {
	await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" }).catch(
		() => {},
	);
}

async function fetchMessage(id: string): Promise<MailpitEmail | null> {
	const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
	if (!res.ok) return null;
	return toEmail((await res.json()) as MailpitMessageDetail);
}

export async function listEmailsTo(recipient: string): Promise<MailpitEmail[]> {
	const query = new URLSearchParams({
		query: `to:${recipient}`,
		limit: "50",
	});
	const res = await fetch(`${MAILPIT_URL}/api/v1/search?${query.toString()}`);
	if (!res.ok) return [];
	const body = (await res.json()) as MailpitMessagesResponse;
	const wanted = recipient.toLowerCase();
	const emails: MailpitEmail[] = [];
	for (const summary of body.messages ?? []) {
		const matchesTo = summary.To?.some(
			(entry) => entry.Address.toLowerCase() === wanted,
		);
		if (!matchesTo) continue;
		const full = await fetchMessage(summary.ID);
		if (full) emails.push(full);
	}
	return emails;
}

export async function waitForEmail(
	recipient: string,
	predicate: (m: MailpitEmail) => boolean,
	options: { since?: Date; timeoutMs?: number } = {},
): Promise<MailpitEmail> {
	const { since, timeoutMs = 30_000 } = options;
	const sinceMs = since?.getTime();
	const deadline = Date.now() + timeoutMs;
	let last: MailpitEmail[] = [];
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

import { render } from "@react-email/render";
import { convert as htmlToText } from "html-to-text";
import type { ReactElement } from "react";

export type RenderedEmail = {
	html: string;
	text: string;
};

export async function renderEmail(
	element: ReactElement,
): Promise<RenderedEmail> {
	const html = await render(element, { pretty: false });
	const text = htmlToText(html, { wordwrap: 80 });
	return { html, text };
}

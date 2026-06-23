import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("../trackEvent", () => ({ trackEvent: trackEventMock }));

import { MATOMO_ACTION, MATOMO_EVENT_CATEGORY } from "../shared/events";
import { TrackedLink } from "../TrackedLink";

beforeEach(() => {
	trackEventMock.mockReset();
});

describe("TrackedLink", () => {
	it("renders an internal href as a link and emits help_link_click with the slug on click", () => {
		render(
			<TrackedLink href="/avis-cse" trackingId="cse_opinion_help">
				En savoir plus
			</TrackedLink>,
		);

		const link = screen.getByRole("link", { name: "En savoir plus" });
		expect(link).toHaveAttribute("href", "/avis-cse");

		fireEvent.click(link);

		expect(trackEventMock).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.HELP,
			action: MATOMO_ACTION.HELP_LINK_CLICK,
			name: "cse_opinion_help",
		});
	});

	it("renders an external href as a plain anchor keeping rel and target", () => {
		render(
			<TrackedLink
				href="https://example.fr/aide?token=secret"
				rel="noopener noreferrer"
				target="_blank"
				trackingId="external_help"
			>
				Aide externe
			</TrackedLink>,
		);

		const link = screen.getByRole("link", { name: "Aide externe" });
		expect(link).toHaveAttribute(
			"href",
			"https://example.fr/aide?token=secret",
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");

		fireEvent.click(link);

		expect(trackEventMock).toHaveBeenCalledWith({
			category: MATOMO_EVENT_CATEGORY.HELP,
			action: MATOMO_ACTION.HELP_LINK_CLICK,
			name: "external_help",
		});
	});

	it("emits the slug, never the URL (CNIL/PII guard)", () => {
		const href = "https://example.fr/aide?token=secret&siren=552100554";
		render(
			<TrackedLink href={href} trackingId="external_help">
				Aide
			</TrackedLink>,
		);

		fireEvent.click(screen.getByRole("link", { name: "Aide" }));

		const payload = JSON.stringify(trackEventMock.mock.calls[0]?.[0]);
		expect(payload).not.toContain(href);
		expect(payload).not.toContain("token=secret");
		expect(payload).not.toContain("552100554");
		expect(trackEventMock.mock.calls[0]?.[0].name).toBe("external_help");
	});

	it("still calls a passed onClick after emitting the event", () => {
		const onClick = vi.fn();
		render(
			<TrackedLink href="/avis-cse" onClick={onClick} trackingId="help">
				Lien
			</TrackedLink>,
		);

		fireEvent.click(screen.getByRole("link", { name: "Lien" }));

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(trackEventMock).toHaveBeenCalledTimes(1);
	});

	it("forwards className to the rendered link", () => {
		render(
			<TrackedLink className="fr-link" href="/avis-cse" trackingId="help">
				Lien
			</TrackedLink>,
		);

		expect(screen.getByRole("link", { name: "Lien" })).toHaveClass("fr-link");
	});
});

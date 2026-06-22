import React from "react";
import "@testing-library/jest-dom/vitest";

// Global mock for next/link — renders a plain <a> tag in all tests.
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => React.createElement("a", { href, ...props }, children),
}));

// Global mock for next/navigation — avoids repeating in test files.
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
}));

// Global mock for next/image — renders a plain <div> with role="img".
vi.mock("next/image", () => ({
	default: ({
		alt,
		src,
		...rest
	}: {
		alt: string;
		src: string;
		[key: string]: unknown;
	}) =>
		React.createElement("div", {
			"aria-label": alt,
			"data-src": src,
			"data-testid": "next-image",
			role: "img",
			...rest,
		}),
}));

// Global mock for next-auth/react — provides a default signIn stub and a
// logged-out `useSession` so components that check the session (e.g. the
// admin-impersonation guards) render without a provider.
vi.mock("next-auth/react", () => ({
	signIn: vi.fn(),
	useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// Global mock for server-only — avoids error in jsdom.
vi.mock("server-only", () => ({}));

// Deterministic blob URL factory: jsdom returns a random `blob:nodedata:<uuid>`
// which makes the FileUpload download-link `href` non-assertable. A stable
// `blob:mock/<name>` lets tests verify the generated object URL precisely.
URL.createObjectURL = vi.fn(
	(blob: Blob) => `blob:mock/${blob instanceof File ? blob.name : "blob"}`,
) as unknown as typeof URL.createObjectURL;
URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;

// Global mock for ~/env — provides test values for all server env vars.
vi.mock("~/env", () => ({
	env: {
		NODE_ENV: "test",
		DATABASE_URL: "postgres://localhost/test",
		AUTH_SECRET: "test-secret",
		EGAPRO_PROCONNECT_CLIENT_ID: "test-client-id",
		EGAPRO_PROCONNECT_CLIENT_SECRET: "test-client-secret",
		EGAPRO_PROCONNECT_ISSUER: "https://proconnect.example.com",
		EGAPRO_WEEZ_API_URL: "https://weez.example.com/api",
		EGAPRO_SUIT_API_URL: "https://api.suit.example.com",
		EGAPRO_GATEWAY_SHARED_SECRET:
			"test-gateway-shared-secret-at-least-32-chars",
		NEXTAUTH_URL: "http://localhost:3000/api/auth",
	},
}));

// Global mock for ~/modules/layout — provides NewTabNotice, Breadcrumb, DsfrPictogram and ResourceBanner passthroughs.
vi.mock("~/modules/layout", () => ({
	DsfrPictogram: ({ path }: { path: string }) =>
		React.createElement("svg", { "aria-hidden": "true", "data-src": path }),
	ResourceBanner: () =>
		React.createElement("div", { "data-testid": "resource-banner" }),
	NewTabNotice: () =>
		React.createElement(
			"span",
			{ className: "fr-sr-only" },
			"Ouvre une nouvelle fenêtre",
		),
	Breadcrumb: ({
		items,
	}: {
		items: Array<{ label: string; href?: string }>;
	}) => {
		const parentItems = items.slice(0, -1);
		const currentItem = items.at(-1);
		if (!currentItem) return null;
		return React.createElement(
			"nav",
			{ "aria-label": "vous êtes ici :" },
			React.createElement(
				"button",
				{ className: "fr-breadcrumb__button", type: "button" },
				"Voir le fil d'Ariane",
			),
			React.createElement(
				"ol",
				null,
				...parentItems.map((item) =>
					React.createElement(
						"li",
						{ key: item.href },
						React.createElement("a", { href: item.href }, item.label),
					),
				),
				React.createElement(
					"li",
					null,
					React.createElement(
						"span",
						{ "aria-current": "page" },
						currentItem.label,
					),
				),
			),
		);
	},
}));

// Global mock for ~/trpc/server — provides HydrateClient passthrough.
// Tests needing specific API mocks can override with their own vi.mock.
vi.mock("~/trpc/server", () => ({
	HydrateClient: ({ children }: { children: React.ReactNode }) =>
		React.createElement(React.Fragment, null, children),
}));

vi.mock(
	"~/modules/declaration-remuneration/shared/draft/useDeclarationDraft",
	() => ({
		useDeclarationDraft: () => ({
			draft: {},
			setField: () => undefined,
			clearDraft: () => undefined,
			hasDraft: false,
			isLoadingDraft: false,
		}),
	}),
);

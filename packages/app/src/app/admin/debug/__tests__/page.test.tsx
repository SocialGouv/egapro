import { render, screen } from "@testing-library/react";

import { maskSecrets } from "../maskSecrets";
import DebugPage from "../page";

jest.mock("@common/config", () => {
  const actual = jest.requireActual("@common/config");
  const { api } = actual.config;
  return {
    ...actual,
    config: {
      ...actual.config,
      api: {
        ...api,
        security: { ...api.security, auth: { ...api.security.auth, secret: "jwt-signing-secret" } },
        postgres: { ...api.postgres, password: "db-password", user: "egapro" },
      },
    },
  };
});

// Mock the getServerSession function
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      staff: true,
      email: "test@example.com",
      tokenApiV1: "session-api-token",
    },
  }),
}));

// Mock the notFound function
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("<DebugPage />", () => {
  it("should render the debug page", async () => {
    render(await DebugPage());

    const heading = screen.getByText("Admin Debug");
    expect(heading).toBeInTheDocument();

    const toggleText = screen.getByText("Activer bouton de debug ?");
    expect(toggleText).toBeInTheDocument();

    const sessionHeading = screen.getByText("Session Content");
    expect(sessionHeading).toBeInTheDocument();

    const configHeading = screen.getByText("Server Side Config");
    expect(configHeading).toBeInTheDocument();
  });

  it("never renders secrets from the config or the session", async () => {
    const { container } = render(await DebugPage());

    expect(container.textContent).not.toContain("jwt-signing-secret");
    expect(container.textContent).not.toContain("db-password");
    expect(container.textContent).not.toContain("session-api-token");
    expect(container.textContent).toContain("egapro");
  });

  it("masks nested secret keys and keeps the rest", () => {
    expect(
      maskSecrets({ a: { clientSecret: "x", clientId: "id" }, list: [{ token: "t" }], empty: { password: "" } }),
    ).toEqual({
      a: { clientSecret: "********", clientId: "id" },
      list: [{ token: "********" }],
      empty: { password: "" },
    });
  });
});

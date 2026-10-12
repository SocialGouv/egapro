import { render, screen } from "@testing-library/react";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import CommencerPage from "../page";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("../Form", () => ({
  CommencerForm: () => <div data-testid="form">Form</div>,
}));

describe("CommencerPage (représentation équilibrée)", () => {
  const mockGetServerSession = getServerSession as jest.Mock;

  beforeEach(() => {
    mockGetServerSession.mockReset();
  });

  it("should only show how to declare for other companies in the information alert", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        email: "test@example.com",
        companies: ["company1"],
        staff: false,
      },
    });

    render((await CommencerPage()) as ReactElement);

    expect(screen.getByTestId("form")).toBeInTheDocument();
    expect(screen.getByText(/Vous devez déclarer pour d'autres entreprises/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "votre profil ProConnect" })).toHaveAttribute(
      "href",
      "https://identite.proconnect.gouv.fr/manage-organizations",
    );
    expect(screen.queryByText(/visualiser ou modifier/)).not.toBeInTheDocument();
    expect(screen.queryByText(/unité économique et sociale/)).not.toBeInTheDocument();
  });
});

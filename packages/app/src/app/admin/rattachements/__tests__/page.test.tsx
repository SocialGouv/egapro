import { render, screen } from "@testing-library/react";

import AdminOwnershipRequestPage from "../page";

// Mock the dependencies
jest.mock("@api/core-domain/useCases/GetOwnershipRequest", () => ({
  GetOwnershipRequest: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue([{ id: 1 }]),
  })),
}));

jest.mock("@api/core-domain/repo", () => ({
  ownershipRequestRepo: {},
}));

jest.mock("@api/core-domain/infra/services", () => ({
  entrepriseService: {},
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      staff: true,
      email: "test@example.com",
    },
  }),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock the OwnershipRequestPage component
jest.mock("../OwnershipRequestList", () => ({
  OwnershipRequestPage: () => <div data-testid="ownership-request-page">Ownership Request Page</div>,
}));

describe("<AdminOwnershipRequestPage />", () => {
  it("should render the ownership request page", async () => {
    const props = {
      params: {},
      searchParams: {},
    };

    const page = await AdminOwnershipRequestPage(props);

    // Check if the page is not null before rendering
    expect(page).not.toBeNull();

    if (page) {
      render(page);

      const ownershipRequestPage = screen.getByTestId("ownership-request-page");
      expect(ownershipRequestPage).toBeInTheDocument();
    }
  });
});

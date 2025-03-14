import { render, screen } from "@testing-library/react";

import { getAllAdminDeclarations } from "../actions";
import DeclarationPage from "../page";

// Mock the DeclarationsList component
jest.mock("../DeclarationsList", () => ({
  DeclarationsList: () => <div data-testid="declarations-list">Declarations List</div>,
}));

// Mock the getAllAdminDeclarations action
jest.mock("../actions", () => ({
  getAllAdminDeclarations: jest.fn().mockResolvedValue({
    ok: true,
    data: {
      count: 0,
      data: [],
    },
  }),
}));

describe("<DeclarationPage />", () => {
  it("should render the search page", async () => {
    const props = {
      searchParams: {
        page: 0,
        limit: 10,
        orderBy: "createdAt",
        orderDirection: "desc",
      },
      searchParamsError: null,
    };

    render(await DeclarationPage(props));

    const heading = screen.getByText("Rechercher une déclaration d'index ou de représentation équilibrée");
    expect(heading).toBeInTheDocument();
  });

  it("should render error alert when searchParamsError exists", async () => {
    const props = {
      searchParams: {
        page: 0,
        limit: 10,
        orderBy: "createdAt",
        orderDirection: "desc",
      },
      searchParamsError: { message: "Error" },
    };

    render(await DeclarationPage(props));

    const errorAlert = screen.getByText("Les paramètres d'url sont malformés.");
    expect(errorAlert).toBeInTheDocument();
  });

  it("should render no results message when no declarations are found", async () => {
    // Mock the getAllAdminDeclarations action to return no results
    (getAllAdminDeclarations as jest.Mock).mockResolvedValueOnce({
      ok: false,
      data: null,
    });

    const props = {
      searchParams: {
        page: 0,
        limit: 10,
        orderBy: "createdAt",
        orderDirection: "desc",
      },
      searchParamsError: null,
    };

    render(await DeclarationPage(props));

    const noResultsMessage = screen.getByText("Aucune déclaration d'index ou de représentation équilibrée trouvée.");
    expect(noResultsMessage).toBeInTheDocument();
  });
});

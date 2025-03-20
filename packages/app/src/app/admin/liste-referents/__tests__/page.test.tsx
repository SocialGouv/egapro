import { GetReferents } from "@api/core-domain/useCases/referent/GetReferents";
import { render, screen } from "@testing-library/react";

import ReferentListPage from "../page";

// Mock the GetReferents use case
jest.mock("@api/core-domain/useCases/referent/GetReferents", () => ({
  GetReferents: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock the referentRepo
jest.mock("@api/core-domain/repo", () => ({
  referentRepo: {},
}));

// Mock the components
jest.mock("../EditReferentModal", () => ({
  EditReferentModal: () => <div data-testid="edit-referent-modal">Edit Referent Modal</div>,
}));

jest.mock("../_actionButtons/ActionButtons", () => ({
  ActionButtons: () => <div data-testid="action-buttons">Action Buttons</div>,
}));

jest.mock("../ReferentList", () => ({
  ReferentList: () => <div data-testid="referent-list">Referent List</div>,
}));

describe("<ReferentListPage />", () => {
  it("should render the page with no referents", async () => {
    render(await ReferentListPage());

    const heading = screen.getByText("Liste des référents Egapro");
    expect(heading).toBeInTheDocument();

    const actionButtons = screen.getByTestId("action-buttons");
    expect(actionButtons).toBeInTheDocument();

    const noReferentsMessage = screen.getByText("Aucun référent Egapro enregistré.");
    expect(noReferentsMessage).toBeInTheDocument();
  });

  it("should render the page with referents", async () => {
    // Mock the GetReferents use case to return referents
    (GetReferents as jest.Mock).mockImplementationOnce(() => ({
      execute: jest.fn().mockResolvedValue([{ id: 1, name: "John Doe" }]),
    }));

    render(await ReferentListPage());

    const heading = screen.getByText("Liste des référents Egapro");
    expect(heading).toBeInTheDocument();

    const actionButtons = screen.getByTestId("action-buttons");
    expect(actionButtons).toBeInTheDocument();

    const referentList = screen.getByTestId("referent-list");
    expect(referentList).toBeInTheDocument();
  });
});

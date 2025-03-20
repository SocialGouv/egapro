import { render, screen } from "@testing-library/react";

import ImpersonatePage from "../page";

// Mock the ImpersonateForm component
jest.mock("../Form", () => ({
  ImpersonateForm: () => <div data-testid="impersonate-form">Impersonate Form</div>,
}));

describe("<ImpersonatePage />", () => {
  it("should render the impersonate page", async () => {
    render(await ImpersonatePage());

    const heading = screen.getByText("Mimoquer un Siren");
    expect(heading).toBeInTheDocument();

    const description = screen.getByText(/En tant qu'administrateur, vous pouvez vous "mimoquer"/);
    expect(description).toBeInTheDocument();

    const form = screen.getByTestId("impersonate-form");
    expect(form).toBeInTheDocument();
  });
});

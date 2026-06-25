import { render, screen } from "@testing-library/react";

import { SelectSiren } from "../SelectSiren";

describe("mes-declarations SelectSiren (mono-entreprise)", () => {
  it("shows the active siren and company name in read-only, without a dropdown or refresh button", () => {
    render(
      <SelectSiren
        sirenListWithCompanyName={[{ siren: "123456789", companyName: "Société Démo" }]}
        currentSiren="123456789"
      />,
    );
    expect(screen.getByText("123456789")).toBeInTheDocument();
    expect(screen.getByText("Société Démo")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rafraichir/i })).not.toBeInTheDocument();
  });

  it("renders nothing when the user has no company", () => {
    const { container } = render(<SelectSiren sirenListWithCompanyName={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

import { getCompany } from "@globalActions/company";
import { render, screen, waitFor } from "@testing-library/react";

import { SelectSiren } from "../SelectSiren";

jest.mock("@globalActions/company", () => ({ getCompany: jest.fn() }));

describe("mes-entreprises SelectSiren (mono-entreprise)", () => {
  beforeEach(() => {
    (getCompany as jest.Mock).mockResolvedValue({ ok: true, data: { simpleLabel: "Société Démo" } });
  });

  it("shows the active siren and the fetched company name, without a dropdown", async () => {
    render(<SelectSiren sirenList={["123456789"]} loadedSiren="123456789" />);
    expect(screen.getByText("123456789")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Société Démo")).toBeInTheDocument());
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no siren", () => {
    const { container } = render(<SelectSiren sirenList={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

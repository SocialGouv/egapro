import { expectToHydrateWithoutMismatch } from "@common/utils/__tests__/hydration";
import { render, screen } from "@testing-library/react";

import CommencerPage from "../page";

describe("<CommencerPage />", () => {
  it("should link to the calculation help and start the simulation", async () => {
    render(await CommencerPage());

    expect(screen.getByText(/Une aide pour le calcul est disponible/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ici/ })).toHaveAttribute("href", "/aide-index");
    expect(screen.getByRole("link", { name: /Suivant/ })).toHaveAttribute("href", "/index-egapro/simulateur/effectifs");
  });

  it("should hydrate the server markup without mismatch", async () => {
    await expectToHydrateWithoutMismatch(await CommencerPage());
  });
});

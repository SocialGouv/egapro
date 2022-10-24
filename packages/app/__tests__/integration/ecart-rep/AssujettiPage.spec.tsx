import type { Screen } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AssujetiPage from "@/pages/ecart-rep/assujetti";

describe("Assujetti Page", () => {
  const getRadioInputOui = (screen: Screen): HTMLInputElement =>
    screen.getByRole("radio", { name: /oui, je suis concerné/i });
  const getRadioInputNon = (screen: Screen): HTMLInputElement =>
    screen.getByRole("radio", { name: /non, je ne suis pas concerné/i });

  it("should select OUI by default", () => {
    render(<AssujetiPage />);
    const inputRadioOui: HTMLInputElement = getRadioInputOui(screen);
    expect(inputRadioOui.checked).toBeTruthy();

    const inputRadioNon: HTMLInputElement = getRadioInputNon(screen);
    expect(inputRadioNon.checked).toBeFalsy();

    expect(screen.queryByRole("link", { name: /Retour à la page d'accueil/i })).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByRole("link", { name: /Suivant/i })).toBeInTheDocument();
  });

  it("should hide Suivant button", async () => {
    // given
    render(<AssujetiPage />);
    const inputRadioOui: HTMLInputElement = getRadioInputOui(screen);
    const inputRadioNon: HTMLInputElement = getRadioInputNon(screen);

    // when
    await userEvent.click(inputRadioNon);

    // expected
    expect(inputRadioOui.checked).toBeFalsy();
    expect(inputRadioNon.checked).toBeTruthy();

    expect(screen.getByRole("link", { name: /Retour à la page d'accueil/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Suivant/i })).toBeNull();
  });
});

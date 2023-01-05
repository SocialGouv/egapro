import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMockValidData } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import EntreprisePage from "@/pages/representation-equilibree/entreprise";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockValidData());

describe("Entreprise page", () => {
  const spies = {} as { routerChangeStart: jest.Mock };

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render inputs filled with company data`, () => {
    render(<EntreprisePage />);

    const sirenInput = screen.getByLabelText(/Siren/i);
    const raisonSocialeInput = screen.getByLabelText(/Raison sociale de l'entreprise/i);
    const codeNafInput = screen.getByLabelText(/Code NAF/i);
    const regionInput = screen.getByLabelText(/Région/i);
    const departementInput = screen.getByLabelText(/Département/i);
    const addressInput = screen.getByLabelText(/Adresse/i);
    const postalCodeInput = screen.getByLabelText(/Code Postal/i);
    const communeInput = screen.getByLabelText(/Commune/i);
    const countryInput = screen.getByLabelText(/Code pays/i);

    expect(sirenInput).not.toHaveValue("");
    expect(raisonSocialeInput).not.toHaveValue("");
    expect(codeNafInput).not.toHaveValue("");
    expect(regionInput).not.toHaveValue("");
    expect(departementInput).not.toHaveValue("");
    expect(addressInput).not.toHaveValue("");
    expect(postalCodeInput).not.toHaveValue("");
    expect(communeInput).not.toHaveValue("");
    expect(countryInput).toHaveValue("");
  });

  it(`should navigate to periode-reference page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EntreprisePage />
      </RouterContext.Provider>,
    );

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(submitButton).toBeEnabled();

    // when
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
    });
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/periode-reference", {
      shallow: false,
    });
  });

  it("should navigate to Declarant page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EntreprisePage />
      </RouterContext.Provider>,
    );
    const backButton = screen.getByRole("link", { name: /Précédent/i });
    expect(backButton).toBeInTheDocument();

    // when
    await userEvent.click(backButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
    });
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/declarant", {
      shallow: false,
    });
  });
});

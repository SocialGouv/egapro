import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMockValidationPageData } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import ValidationPage from "@/pages/representation-equilibree/validation";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockValidationPageData());

global.scrollTo = jest.fn();

describe("Validation page", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should not render "motif non calculable" field`, () => {
    render(<ValidationPage />);
    const percentFemmesDir = screen.getByText(/Pourcentage de femmes parmi les cadres dirigeants/i);
    const percentHommesDir = screen.getByText(/Pourcentage d’hommes parmi les cadres dirigeants/i);

    const percentFemmes = screen.getByText(/Pourcentage de femmes parmi les membres des instances dirigeantes/i);
    const percentHommes = screen.getByText(/Pourcentage d’hommes parmi les membres des instances dirigeantes/i);

    expect(percentFemmesDir).toBeInTheDocument();
    expect(percentHommesDir).toBeInTheDocument();
    expect(percentFemmes).toBeInTheDocument();
    expect(percentHommes).toBeInTheDocument();
  });

  it(`should navigate to transmission page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <ValidationPage />
      </RouterContext.Provider>,
    );
    const submitButton = screen.getByRole("button", {
      name: /Valider/i,
    });

    expect(submitButton).toBeEnabled();
    // when
    await userEvent.click(submitButton);

    screen.debug();
    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/transmission", {
        shallow: false,
      });
    });
  });

  it("should navigate to publication page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <ValidationPage />
      </RouterContext.Provider>,
    );
    const backButton = screen.getByRole("link", { name: /Précédent/i });
    expect(backButton).toBeInTheDocument();

    // when
    await userEvent.click(backButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/publication", {
        shallow: false,
      });
    });
  });
});

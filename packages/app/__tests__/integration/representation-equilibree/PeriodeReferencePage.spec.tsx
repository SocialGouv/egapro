import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMockValidData } from "./mock/useFormManagerMock";
import { useUserMock } from "./mock/user";
import PeriodeReferencePage from "@/pages/representation-equilibree/periode-reference";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMockValidData());

describe("Periode reference page", () => {
  const spies = {} as { routerChangeStart: jest.Mock };

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render with year input filled with company data`, () => {
    render(<PeriodeReferencePage />);

    const yearInput = screen.getByRole("textbox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });

    const dateInput = screen.getByPlaceholderText(/sélectionner une date/i);

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(yearInput).not.toHaveValue("");
    expect(dateInput).toHaveValue("");
    expect(submitButton).toBeDisabled();
  });

  it(`should navigate to ecarts-cadres page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PeriodeReferencePage />
      </RouterContext.Provider>,
    );
    const dateInput = screen.getByPlaceholderText(/sélectionner une date/i);

    const setDateButton = screen.getByRole("button", {
      name: /sélectionner la fin de l'année civile/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when step 1
    await userEvent.click(setDateButton);

    // expected 1
    await waitFor(() => {
      expect(dateInput).toHaveValue("2021-12-31");
    });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // when step 2
    await userEvent.click(submitButton);

    // expected step 2
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
    });
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/ecarts-cadres", {
      shallow: false,
    });
  });

  it("should navigate to entreprise page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <PeriodeReferencePage />
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
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/entreprise", {
      shallow: false,
    });
  });
});

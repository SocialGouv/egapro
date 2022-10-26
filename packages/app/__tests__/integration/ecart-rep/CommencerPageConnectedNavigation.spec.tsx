import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { FAKE_SIREN, useUserMock } from "./mock/user";
import CommencerPage from "@/pages/ecart-rep/commencer";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));

describe("Commencer Page : Connected navigation", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it("should alert user if SIREN is not linked to account", async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );
    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });

    expect(inputYear).toHaveValue("");

    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });

    expect(inputSiren).toHaveValue("");

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when
    await userEvent.selectOptions(inputYear, "2021");
    fireEvent.change(inputSiren, { target: { value: "504920166" } });
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it.skip("should navigate to declarant page", async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );
    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });

    expect(inputYear).toHaveValue("");

    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });

    expect(inputSiren).toHaveValue("");

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when
    await userEvent.selectOptions(inputYear, "2021");
    fireEvent.change(inputSiren, { target: { value: "504920166" } });
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      screen.debug();
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/ecart-rep/declarant", { shallow: false });
    });
  });
});

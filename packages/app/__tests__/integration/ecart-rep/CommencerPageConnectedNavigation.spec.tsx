import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { NOT_LINKED_SIREN, VALID_SIREN } from "./mock/user";
import { useUserMock } from "./mock/user";
import CommencerPage from "@/pages/representation-equilibree/commencer";

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
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );

    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });
    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(inputYear).toHaveValue("");
    expect(inputSiren).toHaveValue("");
    expect(submitButton).toBeDisabled();

    // when
    fireEvent.change(inputYear, { target: { value: "2021" } });
    fireEvent.change(inputSiren, { target: { value: NOT_LINKED_SIREN } });

    // expected
    expect(inputYear).toHaveValue("2021");
    expect(inputSiren).toHaveValue(NOT_LINKED_SIREN);
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  // TODO: find a way to get a status code 200 from msw otherwise submit is disabled
  it.skip("should navigate to declarant page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );
    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });
    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    expect(inputYear).toHaveValue("");
    expect(inputSiren).toHaveValue("");
    expect(submitButton).toBeDisabled();

    // when
    await userEvent.selectOptions(inputYear, "2021");
    fireEvent.change(inputSiren, { target: { value: VALID_SIREN } });
    expect(inputYear).toHaveValue("2021");
    expect(inputSiren).toHaveValue(VALID_SIREN);

    // TODO: find a way to get a status code 200 from msw otherwise submit is disabled
    screen.debug();
    expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/ecart-rep/declarant", { shallow: false });
      screen.debug();
    });
  });
});

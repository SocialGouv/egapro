import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { NOT_LINKED_SIREN, VALID_SIREN, useUserMock } from "./mock/user";
import CommencerPage from "@/pages/representation-equilibree/commencer";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));

describe("Commencer Page : Connected navigation", () => {
  const spies = {} as { routerChangeStart: jest.Mock };

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
    });
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("should navigate to declarant page", async () => {
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

    // when step 1
    await userEvent.selectOptions(inputYear, "2021");
    fireEvent.change(inputSiren, { target: { value: VALID_SIREN } });

    // expected step 1
    expect(inputYear).toHaveValue("2021");
    expect(inputSiren).toHaveValue(VALID_SIREN);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // when step 2
    await userEvent.click(submitButton);

    // expected step 2
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
    });
    expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/declarant", { shallow: false });
  });
});

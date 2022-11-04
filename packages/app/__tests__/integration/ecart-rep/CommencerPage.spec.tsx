import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { FAKE_SIREN, MALFORMED_SIREN, useUserMock } from "./mock/user";
import CommencerPage from "@/pages/representation-equilibree/commencer";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));

describe("Commencer Page", () => {
  it("should render empty string value for year select input and siren text input", () => {
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

    expect(submitButton).toBeDisabled();
  });

  it("should display errors SIREN is malformed", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });

    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });

    // when
    await userEvent.selectOptions(inputYear, "2021");
    expect(inputYear).toHaveValue("2021");
    fireEvent.change(inputSiren, { target: { value: MALFORMED_SIREN } });
    expect(inputSiren).toHaveValue(MALFORMED_SIREN);

    // expected
    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByText("Le Siren est formé de 9 chiffres.")).toBeInTheDocument();
    });
  });

  it("should display errors SIREN does not exist", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <CommencerPage />
      </RouterContext.Provider>,
    );
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    const inputYear = screen.getByRole("combobox", {
      name: /année au titre de laquelle les écarts de représentation sont calculés/i,
    });

    const inputSiren = screen.getByRole("textbox", {
      name: /numéro siren de l'entreprise 9 chiffres/i,
    });

    // when
    await userEvent.selectOptions(inputYear, "2021");
    expect(inputYear).toHaveValue("2021");
    fireEvent.change(inputSiren, { target: { value: FAKE_SIREN } });
    expect(inputSiren).toHaveValue(FAKE_SIREN);

    // expected
    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByText("Numéro SIREN invalide: " + FAKE_SIREN)).toBeInTheDocument();
    });
  });
});

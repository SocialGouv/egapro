import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useUserMock } from "./mock/user";
import EcartsCadres from "@/pages/representation-equilibree/ecarts-cadres";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));

describe("Ecarts cadres page", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render radio input without values only on first render`, () => {
    render(<EcartsCadres />);

    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });

    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });

    const percentFemmesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage de femmes parmi les cadres dirigeants/i,
    });

    const percentHommesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage d'hommes parmi les cadres dirigeants/i,
    });

    const motifInput = screen.queryByRole("combobox", {
      name: /motif de non calculabilité/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(ouiInput).not.toBeChecked();
    expect(nonInput).not.toBeChecked();
    expect(percentFemmesInput).not.toBeInTheDocument();
    expect(percentHommesInput).not.toBeInTheDocument();
    expect(motifInput).not.toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it(`should show only percentage inputs`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EcartsCadres />
      </RouterContext.Provider>,
    );
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });

    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when user clicks "Oui"
    await userEvent.click(ouiInput);

    // expected
    await waitFor(() => {
      expect(ouiInput).toBeChecked();
      expect(nonInput).not.toBeChecked();
      expect(
        screen.queryByRole("spinbutton", {
          name: /pourcentage de femmes parmi les cadres dirigeants/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("spinbutton", {
          name: /pourcentage d'hommes parmi les cadres dirigeants/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", {
          name: /motif de non calculabilité/i,
        }),
      ).not.toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it(`should show only motif input`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EcartsCadres />
      </RouterContext.Provider>,
    );
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });

    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });

    const percentFemmesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage de femmes parmi les cadres dirigeants/i,
    });

    const percentHommesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage d'hommes parmi les cadres dirigeants/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    expect(
      screen.queryByRole("combobox", {
        name: /motif de non calculabilité/i,
      }),
    ).not.toBeInTheDocument();
    // when user clicks "Non"
    await userEvent.click(nonInput);

    const motif = screen.getByRole("combobox", {
      name: /motif de non calculabilité/i,
    });
    // expected
    await waitFor(() => {
      expect(ouiInput).not.toBeChecked();
      expect(nonInput).toBeChecked();
      expect(percentFemmesInput).not.toBeInTheDocument();
      expect(percentHommesInput).not.toBeInTheDocument();
      expect(motif).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it(`should auto fill the other percentage input`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EcartsCadres />
      </RouterContext.Provider>,
    );
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });

    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });

    const motifInput = screen.queryByRole("combobox", {
      name: /motif de non calculabilité/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when user clicks "Oui"
    await userEvent.click(ouiInput);

    // expected
    const percentFemmes = screen.getByRole("spinbutton", {
      name: /pourcentage de femmes parmi les cadres dirigeants/i,
    });

    const percentHommes = screen.getByRole("spinbutton", {
      name: /pourcentage d'hommes parmi les cadres dirigeants/i,
    });

    await waitFor(() => {
      expect(ouiInput).toBeChecked();
      expect(nonInput).not.toBeChecked();
      expect(percentFemmes).toBeInTheDocument();
      expect(percentHommes).toBeInTheDocument();
      expect(motifInput).not.toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // when user type women percentage first

    await userEvent.type(percentFemmes, "30");

    // expected
    await waitFor(() => {
      expect(percentHommes).toHaveValue(70);
      expect(submitButton).toBeEnabled();
    });
  });

  it(`should navigate to ecarts-membres page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EcartsCadres />
      </RouterContext.Provider>,
    );
    const ouiInput = screen.getByRole("radio", {
      name: /oui/i,
    });

    const nonInput = screen.getByRole("radio", {
      name: /non/i,
    });

    const percentFemmesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage de femmes parmi les cadres dirigeants/i,
    });

    const percentHommesInput = screen.queryByRole("spinbutton", {
      name: /pourcentage d'hommes parmi les cadres dirigeants/i,
    });

    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });

    // when user clicks "Non"
    await userEvent.click(nonInput);

    const motif = screen.getByRole("combobox", {
      name: /motif de non calculabilité/i,
    });
    // expected
    await waitFor(() => {
      expect(ouiInput).not.toBeChecked();
      expect(nonInput).toBeChecked();
      expect(percentFemmesInput).not.toBeInTheDocument();
      expect(percentHommesInput).not.toBeInTheDocument();
      expect(motif).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    expect(motif).toHaveValue("");
    // when user selects "aucun_cadre_dirigeant"
    await userEvent.selectOptions(motif, "aucun_cadre_dirigeant");

    // expected
    expect(submitButton).toBeEnabled();

    // when user clicks on submit
    await userEvent.click(submitButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/ecarts-membres", {
        shallow: false,
      });
    });
  });

  it("should navigate to periode-reference page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <EcartsCadres />
      </RouterContext.Provider>,
    );
    const backButton = screen.getByRole("link", { name: /Précédent/i });
    expect(backButton).toBeInTheDocument();

    // when user clicks on back button
    await userEvent.click(backButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/periode-reference", {
        shallow: false,
      });
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context";
import singletonRouter from "next/router";

import { useFormManagerMock } from "./mock/useFormManagerMock";
import { FAKE_USER, useUserMock } from "./mock/user";
import DeclarantPage from "@/pages/representation-equilibree/declarant";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));
jest.mock("@services/apiClient/useFormManager", () => useFormManagerMock());

describe("Déclarant page", () => {
  const spies: any = {};

  beforeEach(() => {
    spies.routerChangeStart = jest.fn();
    singletonRouter.events.on("routeChangeStart", spies.routerChangeStart);
  });

  afterEach(() => {
    singletonRouter.events.off("routeChangeStart", spies.routerChangeStart);
    jest.resetAllMocks();
  });

  it(`should render email input filled with connected user email`, () => {
    render(<DeclarantPage />);

    const nameInput = screen.getByTestId("nom"); // no other choice because of non ambiguous search param : nom from prénom
    const firstNameInput = screen.getByLabelText(/Prénom/i);
    const phoneNumber = screen.getByRole("textbox", {
      name: /numéro de téléphone/i,
    });
    const emailInput = screen.getByRole("textbox", {
      name: /email/i,
    });
    const checkboxInput = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    expect(nameInput).toHaveValue("");
    expect(firstNameInput).toHaveValue("");
    expect(phoneNumber).toHaveValue("");
    expect(emailInput).toHaveValue(FAKE_USER.email);
    expect(checkboxInput).not.toBeChecked();
    expect(submitButton).toBeDisabled();
  });

  it(`should display all form validation errors`, async () => {
    render(<DeclarantPage />);

    const nameInput = screen.getByTestId("nom"); // no other choice because of non ambiguous search param : nom from prénom
    const firstNameInput = screen.getByLabelText(/Prénom/i);
    const phoneNumber = screen.getByRole("textbox", {
      name: /numéro de téléphone/i,
    });
    const emailInput = screen.getByRole("textbox", {
      name: /email/i,
    });
    const checkboxInput = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    expect(nameInput).toHaveValue("");
    expect(firstNameInput).toHaveValue("");
    expect(phoneNumber).toHaveValue("");
    expect(emailInput).toHaveValue(FAKE_USER.email);
    expect(checkboxInput).not.toBeChecked();
    expect(submitButton).toBeDisabled();

    // when
    await userEvent.type(nameInput, "A");
    await userEvent.type(firstNameInput, "A");
    await userEvent.type(phoneNumber, "1");
    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(firstNameInput, { target: { value: "" } });
    fireEvent.change(phoneNumber, { target: { value: "" } });

    // expected
    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument();
      expect(screen.getByText(/Le prénom est requis/i)).toBeInTheDocument();
      expect(screen.getByText(/Le téléphone est requis/i)).toBeInTheDocument();
    });

    // when step 2
    fireEvent.change(phoneNumber, { target: { value: "A" } });

    // expected step 2
    await waitFor(() => {
      expect(screen.getByText(/Le numéro de téléphone doit être composé de 10 chiffres/i)).toBeInTheDocument();
    });
  });

  it(`should navigate to entreprise page`, async () => {
    render(
      <RouterContext.Provider value={singletonRouter}>
        <DeclarantPage />
      </RouterContext.Provider>,
    );

    const nameInput = screen.getByTestId("nom"); // no other choice because of non ambiguous search param : nom from prénom
    const firstNameInput = screen.getByLabelText(/Prénom/i);
    const phoneNumber = screen.getByRole("textbox", {
      name: /numéro de téléphone/i,
    });
    const emailInput = screen.getByRole("textbox", {
      name: /email/i,
    });
    const checkboxInput = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", {
      name: /suivant/i,
    });
    expect(nameInput).toHaveValue("");
    expect(firstNameInput).toHaveValue("");
    expect(phoneNumber).toHaveValue("");
    expect(emailInput).toHaveValue(FAKE_USER.email);
    expect(checkboxInput).not.toBeChecked();
    expect(submitButton).toBeDisabled();

    // when
    await userEvent.type(nameInput, "NAME");
    await userEvent.type(firstNameInput, "FIRSTNAME");
    await userEvent.type(phoneNumber, "1234567890");
    await userEvent.click(checkboxInput);

    // expected
    await waitFor(() => {
      screen.debug();
      expect(submitButton).toBeEnabled();
    });

    // when step 2
    await userEvent.click(submitButton);

    // expected step 2
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/entreprise", { shallow: false });
    });
  });

  it("should navigate to Commencer page", async () => {
    // given
    render(
      <RouterContext.Provider value={singletonRouter}>
        <DeclarantPage />
      </RouterContext.Provider>,
    );
    const backButton = screen.getByRole("link", { name: /Précédent/i });
    expect(backButton).toBeInTheDocument();

    // when
    fireEvent.click(backButton);

    // expected
    await waitFor(() => {
      expect(spies.routerChangeStart).toHaveBeenCalled();
      expect(spies.routerChangeStart).toHaveBeenCalledWith("/representation-equilibree/commencer", { shallow: false });
    });
  });
});

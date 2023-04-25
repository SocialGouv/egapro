import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssujetiPage from "@/pages/representation-equilibree/assujetti";
import mockRouter from "next-router-mock";

jest.mock("next/router", () => require("next-router-mock"));

// for radio inputs, cast is mandatory to have access to checked attribute
const getRadioInputOui = () => screen.getByRole("radio", { name: /oui, je suis concerné/i }) as HTMLInputElement;
const getRadioInputNon = () => screen.getByRole("radio", { name: /non, je ne suis pas concerné/i }) as HTMLInputElement;

describe("Assujetti Page", () => {
  mockRouter.push("/");

  it("should select OUI by default", () => {
    // Set the initial url:

    render(<AssujetiPage />);
    const inputRadioOui = getRadioInputOui();
    expect(inputRadioOui.checked).toBeTruthy();

    const inputRadioNon = getRadioInputNon();
    expect(inputRadioNon.checked).toBeFalsy();

    expect(screen.queryByRole("link", { name: /Retour à la page d'accueil/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Suivant/i })).toBeInTheDocument();
  });

  it("should hide Suivant button", async () => {
    // given
    render(<AssujetiPage />);
    const inputRadioOui = getRadioInputOui();
    const inputRadioNon = getRadioInputNon();

    // when
    await userEvent.click(inputRadioNon);

    // expected
    expect(inputRadioOui.checked).toBeFalsy();
    expect(inputRadioNon.checked).toBeTruthy();

    expect(screen.getByRole("link", { name: /Retour à la page d'accueil/i })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Suivant/i })).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { type Session } from "next-auth";

import { HeaderAccountMenu } from "../app/HeaderAccountMenu";

const session = { data: { user: { email: "email@example.fr" } } as Session };

const renderMenu = (props: { isEmailLogin?: boolean; isProConnectTest?: boolean }) =>
  render(
    <HeaderAccountMenu
      isEmailLogin={props.isEmailLogin ?? false}
      isProConnectTest={props.isProConnectTest ?? false}
      session={session}
      staff={false}
    />,
  );

describe("<HeaderAccountMenu />", () => {
  it("links to the production ProConnect account page by default", () => {
    renderMenu({});

    expect(screen.getByRole("link", { name: "Accès à mon compte ProConnect" })).toHaveAttribute(
      "href",
      "https://identite.proconnect.gouv.fr",
    );
  });

  it("links to the ProConnect sandbox account page in test mode", () => {
    renderMenu({ isProConnectTest: true });

    expect(screen.getByRole("link", { name: "Accès à mon compte ProConnect" })).toHaveAttribute(
      "href",
      "https://identite-sandbox.proconnect.gouv.fr",
    );
  });

  it("offers the ownership request instead of ProConnect with email login", () => {
    renderMenu({ isEmailLogin: true });

    expect(screen.queryByRole("link", { name: "Accès à mon compte ProConnect" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Demande de rattachement" })).toHaveAttribute("href", "/rattachement");
  });
});

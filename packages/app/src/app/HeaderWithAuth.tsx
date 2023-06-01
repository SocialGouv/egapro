"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Header, { type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { Brand } from "@components/Brand";
import { signOut, useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";

export interface HeaderWithAuthProps {
  homeLinkProps: HeaderProps["homeLinkProps"];
}
export const HeaderWithAuth = ({ homeLinkProps }: HeaderWithAuthProps) => {
  const session = useSession();

  return (
    <Header
      brandTop={<Brand />}
      serviceTitle="Egapro"
      serviceTagline="Index de l’égalité professionnelle et représentation équilibrée femmes – hommes"
      homeLinkProps={homeLinkProps}
      // navigation={<Navigation />}
      quickAccessItems={(() => {
        switch (session.status) {
          case "authenticated":
            return [
              {
                iconId: "fr-icon-account-fill",
                text: `${session.data.user.email}${session.data.user.staff ? " (staff)" : ""}`,
                linkProps: { href: "/index-egapro/tableauDeBord/mon-profil" },
              },
              {
                iconId: "fr-icon-lock-unlock-line",
                buttonProps: {
                  className: fr.cx("fr-btn--secondary"),
                  async onClick(e) {
                    e.preventDefault();
                    await signOut({ callbackUrl: "/" });
                  },
                },
                text: "Se déconnecter",
              },
            ];
          case "unauthenticated":
            return [
              {
                iconId: "fr-icon-lock-line",
                linkProps: {
                  href: "/login",
                  className: fr.cx("fr-btn--secondary"),
                },
                text: "Se connecter",
              },
            ];
          default: // loading
            return [
              {
                iconId: "fr-icon-account-fill",
                text: <Skeleton width={200} highlightColor="var(--text-action-high-blue-france)" />,
                linkProps: {
                  href: "#",
                  onClick(e) {
                    e.preventDefault();
                  },
                },
              },
              {
                iconId: "fr-icon-lock-line",
                text: <Skeleton width={110} />,
                buttonProps: {
                  className: fr.cx("fr-btn--secondary"),
                },
              },
            ];
        }
      })()}
    />
  );
};
